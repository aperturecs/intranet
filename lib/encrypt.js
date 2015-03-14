'use strict';

var crypto = require('crypto');

// Use salts to hash
var Salt1 = 'AeBV``ROPEA1NEGEATIOxYAT10NAL0_LEREGRE3SSPENXS3H3JAG0NHG5ATICTUREI3FITED3EBLUr';
var Salt2 = '=%ODSAVE7He812&x54f6453aeAc0Supr2!ac!Mad(e&@UEEN5c7b7bf09#33(%FsS0NGANLAST1NV1';

module.exports = function encrypt(original, times) {
    if (!times) times = 3;
    for (var i=0;i<times;i++) {
        original = crypto.createHash('sha1').update(Salt1 + original + Salt2).digest('hex');
    }
    return original;
}
