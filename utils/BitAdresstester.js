
const Base58 = require('base58')
function detectPrivateKeyFormat(privateKey) {
    function isHexadecimal(s) {
        return /^[0-9A-Fa-f]{2,}$/.test(s);
    }
    function isBase58(s) {
        try {
            Base58.decode(s);
            return true;
        } catch (error) {
            return false;
        }
    }
    privateKey = privateKey.trim();

    if (isHexadecimal(privateKey)) {
        return 'hexadecimal';
    }
    if (isBase58(privateKey)) {
        return 'base58';
    }
    return null;
}

module.exports = detectPrivateKeyFormat;
