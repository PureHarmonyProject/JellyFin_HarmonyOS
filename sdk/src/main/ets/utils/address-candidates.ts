/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { url } from "@kit.ArkTS";

import { HTTP_PROTOCOL, HTTPS_PROTOCOL, parseUrl, copyUrl, hasProtocolAndPort, isDefaultPort } from '../url';

/** The default http port for Jellyfin servers. */
export const JF_HTTP_PORT = 8096;

/** The default https port for Jellyfin servers. */
export const JF_HTTPS_PORT = 8920;

/**
 * Gets the score of a url based on common server setups.
 * @param url The url to evaluate.
 * @returns The score.
 */
function getScore(url: url.URL): number {
	let score = 0;

	// Prefer secure connections
	if (url.protocol === HTTPS_PROTOCOL) {
		score += 5;
	} else {
		score -= 5;
	}

	if (url.port === JF_HTTP_PORT.toString()) {
		score += 2; // Using the Jellyfin http port is common
	} else if (url.port === JF_HTTPS_PORT.toString()) {
		score -= 1; // Using the Jellyfin https port is not common
	}

	// Prefer default ports for http(s) protocols
	if (isDefaultPort(url)) {
		score += 3;
	}

	return score;
}

/**
 * Gets a list of address candidates url strings
 * from a provided url address string.
 * @param input A server url address string.
 * @returns A list of potential server addresses.
 */
export function getAddressCandidates(input: string): Array<string> {
	const candidates: Array<url.URL> = [];

	try {
		const url = parseUrl(input);

		// If the input specifies the protocol and port return it directly
		if (hasProtocolAndPort(input, url)) {
			return [ url.toString() ];
		}

		// Add the parsed url as a candidate
		candidates.push(url);

		// Always try https if http is specified
		if (url.protocol === HTTP_PROTOCOL) {
			const copy = copyUrl(url);
			copy.protocol = HTTPS_PROTOCOL;
			candidates.push(copy);
		}

		// Add candidates with JF default ports for candidates using the protocol default port
		candidates
			.filter(isDefaultPort)
			.forEach(val => {
				if (val.protocol === HTTP_PROTOCOL) {
					const copy = copyUrl(val);
					copy.port = JF_HTTP_PORT.toString();
					candidates.push(copy);
				} else if (val.protocol === HTTPS_PROTOCOL) {
					let copy = copyUrl(val);
					copy.port = JF_HTTP_PORT.toString();
					candidates.push(copy);
					copy = copyUrl(val);
					copy.port = JF_HTTPS_PORT.toString();
					candidates.push(copy);
				}
			});

		// Sort by score
		candidates.sort((a, b) => getScore(b) - getScore(a));

		// Return the list of candidate urls as strings
		return candidates.map(candidate => candidate.toString());
	} catch (err) {
		console.warn(err);
		return [];
	}
}
