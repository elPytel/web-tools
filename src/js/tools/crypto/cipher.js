/**
 * Base Cipher template class
 * Subclass this and implement `encrypt` and `decrypt` methods.
 */
export class Cipher {
	constructor(options = {}) {
		this.options = options;
	}

	/**
	 * Encrypt plaintext.
	 * @param {string} plaintext
	 * @param {object} [opts]
	 * @returns {string}
	 */
	encrypt(plaintext, opts = {}) {
		throw new Error('encrypt() not implemented');
	}

	/**
	 * Decrypt ciphertext.
	 * @param {string} ciphertext
	 * @param {object} [opts]
	 * @returns {string}
	 */
	decrypt(ciphertext, opts = {}) {
		throw new Error('decrypt() not implemented');
	}
}

export default Cipher;

