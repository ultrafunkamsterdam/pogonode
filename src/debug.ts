import * as logger from 'winston';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment';

import APIHelper from './helpers/api';
import Walker from './helpers/walker';

import * as pogobuf from '../pogobuf';

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    'timestamp': function() {
        return moment().format('HH:mm:ss');
    },
    'colorize': true,
    'level': 'debug',
});

let config = require('./helpers/config').load();
let state = JSON.parse(fs.readFileSync('data/state.json', 'utf8'));

let apihelper = new APIHelper(config, state);
let walker = new Walker(config, state);

function testVersion(version) {
    logger.info('Version', version);
    logger.info('Client Version', apihelper.versionToClientVersion(version));
    logger.info('iOS Version', apihelper.versionToiOSVersion(version));
}

function testRequestIds() {
    let client = new pogobuf.Client();
    for (let i = 0; i < 10; i++) {
        let id = (<any>client).getRequestID();
        logger.info('%s', id.toString(16));
    }
}

testRequestIds();