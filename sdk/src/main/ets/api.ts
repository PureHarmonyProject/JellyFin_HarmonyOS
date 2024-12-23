/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AxiosInstance, AxiosResponse } from '@ohos/axios';
import globalInstance from '@ohos/axios';
import { Configuration } from './generated-client/configuration';
import { ClientInfo } from './models/client-info';
import { DeviceInfo } from './models/device-info';
import type { AuthenticationResult } from './generated-client/models/authentication-result';
import { getSessionApi } from './utils/api/session-api';
import { getUserApi } from './utils/api/user-api';
import { getAuthorizationHeader } from './utils/authentication';


/** The authorization header field name. */
export const AUTHORIZATION_HEADER = 'Authorization';

/** Class representing the Jellyfin API. */
export class Api {

	basePath;
	clientInfo;
	deviceInfo:DeviceInfo;
	accessToken;
	axiosInstance;
	userId: string;

	constructor(
		basePath: string,
		clientInfo: ClientInfo,
		deviceInfo: DeviceInfo,
		accessToken = '',
		axiosInstance: AxiosInstance = globalInstance
	) {
		// Remove trailing slash if present
		this.basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
		this.clientInfo = clientInfo;
		this.deviceInfo = deviceInfo;
		this.accessToken = accessToken;
		this.axiosInstance = axiosInstance;
	}

	get configuration(): Configuration {
		return new Configuration({
			basePath: this.basePath,
			apiKey: this.authorizationHeader
		});
	}

	/**
	 * Convenience method for authenticating a user by name and updating the internal state.
	 * @param username The username.
	 * @param password The user password if required.
	 */
	authenticateUserByName(username: string, password?: string): Promise<AxiosResponse<AuthenticationResult>> {
		return getUserApi(this).authenticateUserByName(
			// The axios client does some strange wrapping of the param object
			{ authenticateUserByName: { Username: username, Pw: password } },
			// The authorization header is required for the request to succeed
			{ headers: { [AUTHORIZATION_HEADER]: this.authorizationHeader } }
		).then(response => {
			// Update the current token and configuration object
			this.accessToken = response.data.AccessToken || '';
			return response;
		});
	}

	/**
	 * Convenience method for logging out and updating the internal state.
	 */
	logout(): Promise<AxiosResponse<never> | AxiosResponse<void>> {
		return getSessionApi(this).reportSessionEnded().then(response => {
			this.accessToken = '';
			return response;
		});
	}

	get authorizationHeader(): string {
		return getAuthorizationHeader(this.clientInfo, this.deviceInfo, this.accessToken);
	}

	createUrl(pathTemplate: string) {
		return this.basePath + pathTemplate
	}
}
