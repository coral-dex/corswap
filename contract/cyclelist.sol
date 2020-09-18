pragma solidity ^0.6.10;

import "../common/math.sol";

library CycleList {

    uint256 private constant ONEDAY = 600;
    uint256 private constant LIMIT = 7;

    struct RecordOfDay {
        uint256 len;
        uint256 timestamp;
        uint256[] list;
    }

    struct List {
        mapping(uint256 => RecordOfDay) maps;
    }

    function getDay(uint256 time, uint256 n) internal pure returns (uint256, uint256) {
        uint256 index = time % (n * ONEDAY) / ONEDAY;
        return (index % n, time - time % ONEDAY);
    }

    function push(List storage self, uint256 key) internal returns (uint256[] memory ret) {
        (uint256 index, uint256 time) = getDay(block.timestamp, LIMIT);
        RecordOfDay storage record = self.maps[index];
        if (record.timestamp != 0) {
            if (time == record.timestamp) {
                if (record.len < record.list.length) {
                    record.list[record.len] = key;
                } else {
                    record.list.push(key);
                }
                record.len++;
            } else {
                ret = new uint256[](record.len);
                for (uint256 i = 0; i < record.len; i++) {
                    ret[i] = record.list[i];
                }
                record.timestamp = time;
                record.list[0] = key;
                record.len = 1;
                return ret;
            }
        } else {
            record.timestamp = time;
            record.list.push(key);
            record.len = 1;
        }
    }

    function list(List storage self) internal view returns (uint256[] memory ret) {
        uint256 len;
        uint256 lastTime = (now - now % ONEDAY) - ((LIMIT - 1) * ONEDAY);
        for (uint256 i = 0; i < LIMIT; i++) {
            if (self.maps[i].timestamp >= lastTime) {
                len += self.maps[i].len;
            }

        }

        ret = new uint256[](len);
        uint256 index;
        for (uint256 i = 0; i < LIMIT; i++) {
            if (self.maps[i].timestamp >= lastTime) {
                RecordOfDay memory record = self.maps[i];
                if (record.len > 0) {
                    for (uint256 j = 0; j < record.len; j++) {
                        ret[index++] = record.list[j];
                    }
                }
            }

        }
        return ret;
    }
}