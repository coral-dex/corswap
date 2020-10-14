pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

library Output {
    int128 private constant MIN_64x64 = - 0x80000000000000000000000000000000;
    int128 private constant MAX_64x64 = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    function divuu(uint256 x, uint256 y) private pure returns (uint128) {
        require(y != 0);

        uint256 result;

        if (x <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
            result = (x << 64) / y;
        else {
            uint256 msb = 192;
            uint256 xc = x >> 192;
            if (xc >= 0x100000000) {xc >>= 32;
                msb += 32;}
            if (xc >= 0x10000) {xc >>= 16;
                msb += 16;}
            if (xc >= 0x100) {xc >>= 8;
                msb += 8;}
            if (xc >= 0x10) {xc >>= 4;
                msb += 4;}
            if (xc >= 0x4) {xc >>= 2;
                msb += 2;}
            if (xc >= 0x2) msb += 1;
            // No need to shift xc anymore

            result = (x << 255 - msb) / ((y - 1 >> msb - 191) + 1);
            require(result <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);

            uint256 hi = result * (y >> 128);
            uint256 lo = result * (y & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);

            uint256 xh = x >> 192;
            uint256 xl = x << 64;

            if (xl < lo) xh -= 1;
            xl -= lo;
            // We rely on overflow behavior here
            lo = hi << 128;
            if (xl < lo) xh -= 1;
            xl -= lo;
            // We rely on overflow behavior here

            assert(xh == hi >> 128);

            result += xl / y;
        }

        require(result <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        return uint128(result);
    }

    function divu(uint256 x, uint256 y) private pure returns (int128) {
        require(y != 0);
        uint128 result = divuu(x, y);
        require(result <= uint128(MAX_64x64));
        return int128(result);
    }

    function pow(int128 x, uint256 y) private pure returns (int128) {
        uint256 absoluteResult;
        bool negativeResult = false;
        if (x >= 0) {
            absoluteResult = powu(uint256(x) << 63, y);
        } else {
            // We rely on overflow behavior here
            absoluteResult = powu(uint256(uint128(- x)) << 63, y);
            negativeResult = y & 1 > 0;
        }

        absoluteResult >>= 63;

        if (negativeResult) {
            require(absoluteResult <= 0x80000000000000000000000000000000);
            return - int128(absoluteResult);
            // We rely on overflow behavior here
        } else {
            require(absoluteResult <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
            return int128(absoluteResult);
            // We rely on overflow behavior here
        }
    }

    function powu(uint256 x, uint256 y) private pure returns (uint256) {
        if (y == 0) return 0x80000000000000000000000000000000;
        else if (x == 0) return 0;
        else {
            int256 msb = 0;
            uint256 xc = x;
            if (xc >= 0x100000000000000000000000000000000) {xc >>= 128;
                msb += 128;}
            if (xc >= 0x10000000000000000) {xc >>= 64;
                msb += 64;}
            if (xc >= 0x100000000) {xc >>= 32;
                msb += 32;}
            if (xc >= 0x10000) {xc >>= 16;
                msb += 16;}
            if (xc >= 0x100) {xc >>= 8;
                msb += 8;}
            if (xc >= 0x10) {xc >>= 4;
                msb += 4;}
            if (xc >= 0x4) {xc >>= 2;
                msb += 2;}
            if (xc >= 0x2) msb += 1;
            // No need to shift xc anymore

            int256 xe = msb - 127;
            if (xe > 0) x >>= uint256(xe);
            else x <<= uint256(- xe);

            uint256 result = 0x80000000000000000000000000000000;
            int256 re = 0;

            while (y > 0) {
                if (y & 1 > 0) {
                    result = result * x;
                    y -= 1;
                    re += xe;
                    if (result >=
                        0x8000000000000000000000000000000000000000000000000000000000000000) {
                        result >>= 128;
                        re += 1;
                    } else result >>= 127;
                    if (re < - 127) return 0;
                    // Underflow
                    require(re < 128);
                    // Overflow
                } else {
                    x = x * x;
                    y >>= 1;
                    xe <<= 1;
                    if (x >=
                        0x8000000000000000000000000000000000000000000000000000000000000000) {
                        x >>= 128;
                        xe += 1;
                    } else x >>= 127;
                    if (xe < - 127) return 0;
                    // Underflow
                    require(xe < 128);
                    // Overflow
                }
            }

            if (re > 0) result <<= uint256(re);
            else if (re < 0) result >>= uint256(- re);

            return result;
        }
    }

    function mulu(int128 x, uint256 y) private pure returns (uint256) {
        if (y == 0) return 0;

        require(x >= 0);

        uint256 lo = (uint256(x) * (y & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)) >> 64;
        uint256 hi = uint256(x) * (y >> 128);

        require(hi <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);
        hi <<= 64;

        require(hi <=
            0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF - lo);
        return hi + lo;
    }

    function calc(uint256 n) internal pure returns (uint256) {
        int128 e = divu(9999997827, 10000000000);
        int128 d = pow(e, n * n);
        return mulu(d, 5000 * (10 ** 18));
    }
}