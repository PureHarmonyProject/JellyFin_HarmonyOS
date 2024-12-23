/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ServerDiscoveryInfo } from '../generated-client/models';
import type { Jellyfin } from '../jellyfin';
import type { RecommendedServerInfo } from '../models/recommended-server-info';

import { RecommendedServerInfoScore } from '../models/recommended-server-info';
import { getAddressCandidates } from '../utils/address-candidates';
import { LocalServerDiscovery } from './local-server-discovery';

import { RecommendedServerDiscovery } from './recommended-server-discovery';

/** Class used for discovering recommended servers. */
export class DiscoveryService {
	private jellyfin;
	private recommendedServerDiscovery:RecommendedServerDiscovery;
	private localServerDiscovery:LocalServerDiscovery;

	constructor(jellyfin: Jellyfin) {
		this.jellyfin = jellyfin;
		this.recommendedServerDiscovery = new RecommendedServerDiscovery(this.jellyfin);
		this.localServerDiscovery = new LocalServerDiscovery();
	}

	/**
	 * Finds the best server from a list of recommended servers by score.
	 * @param servers A list of recommended servers.
	 * @returns The best scoring recommended server.
	 */
	findBestServer(servers: Array<RecommendedServerInfo>): RecommendedServerInfo | undefined {
		// First look for GREAT scores
		let best = servers.find(server => server.score === RecommendedServerInfoScore.GREAT);
		// If no GREAT scores, look for GOOD scores
		if (!best) {
			best = servers.find(server => server.score === RecommendedServerInfoScore.GOOD);
		}
		// If no GREAT or GOOD scores, look for OK scores
		if (!best) {
			best = servers.find(server => server.score === RecommendedServerInfoScore.OK);
		}
		// Do NOT return any BAD scores
		return best;
	}

	/**
	 * Gets a list of address candidates url strings
	 * from a provided url address string.
	 * @param input A server url address string.
	 * @returns A list of potential server addresses.
	 */
	getAddressCandidates(input: string): Array<string> {
		return getAddressCandidates(input);
	}

	/**
	 * Gets a list of recommended server information from a provided
	 * list of possible server addresses.
	 * @param servers A list of possible server addresses.
	 * @param minimumScore The minimum server score to include in the results.
	 * @returns A list of RecommendedServerInfo from the possible server addresses.
	 */
	async getRecommendedServers(
		servers: Array<string>,
		minimumScore?: RecommendedServerInfoScore
	): Promise<Array<RecommendedServerInfo>> {
		return this.recommendedServerDiscovery.discover(servers, minimumScore);
	}

	/**
	 * Gets a list of recommended server information from the address
	 * candidates of a potential server address.
	 * @param input A potential server address.
	 * @param minimumScore The minimum server score to include in the results.
	 * @returns A list of RecommendedServerInfo from the address candidates.
	 */
	async getRecommendedServerCandidates(
		input: string,
		minimumScore?: RecommendedServerInfoScore
	): Promise<Array<RecommendedServerInfo>> {
		return this.getRecommendedServers(this.getAddressCandidates(input), minimumScore);
	}

	async discoverLocalServers(timeout: number = LocalServerDiscovery.DISCOVERY_TIMEOUT,
		maxServers: number = LocalServerDiscovery.DISCOVERY_MAX_SERVERS):Promise<ServerDiscoveryInfo[]>{
		return this.localServerDiscovery.discover(timeout,maxServers)
	}
}
