import * as _ from 'lodash';

function randomTriangular(lower, upper, mode) {
    let c = (mode - lower) / (upper - lower);
    let u = Math.random();

    if (u <= c) {
        return lower + Math.sqrt(u * (upper - lower) * (mode - lower));
    } else {
        return upper - Math.sqrt((1 - u) * (upper - lower) * (upper - mode));
    }
}

let timer = null;
let start = 0; // time from start, get updated at register();
let course = (Math.random() * 360).toFixed(1); // last course, used to calculate next one
let lastLocationFixTimeStamp = new Date().getTime() - _.random(1000, 2000);
let lastLocationFix = null;
let locationFixes = []; // location fixes get generated all the taime and added as batch when api called
let lastPos = {latitude: 0.0, longitude: 0.0};

module.exports.register = function(config, client, state) {

    start = new Date().getTime() - _.random(4500, 5500);
    lastPos = {latitude: state.pos.lat, longitude: state.pos.lng};

    let updateLocFixes = function() {
        let moving = (state.pos.lat !== lastPos.latitude) || (state.pos.lng !== lastPos.longitude);
        lastPos = {latitude: state.pos.lat, longitude: state.pos.lng};
        if (lastLocationFix == null || moving || Math.random() > 0.85) {
            let values = [5, 5, 5, 5, 10, 10, 10, 30, 30, 50, 65];
            values.unshift(Math.floor(Math.random() * (80 - 66)) + 66);
            client.playerLocationAccuracy = values[Math.floor(values.length * Math.random())];

            let junk = Math.random() < 0.03;
            let loc: any = {
                            provider: 'fused',
                            latitude: junk ? 360.0 : client.playerLatitude,
                            longitude: junk ? 360.0 : client.playerLongitude,
                            altitude: junk ? 0.0 : (client.playerAltitude || randomTriangular(300, 400, 350)),
                            provider_status: 3,
                            location_type: 1,
                            floor: 0,
                            course: -1,
                            speed: -1,
                        };
            if (Math.random() < 0.95) {
                loc.course = randomTriangular(0, 359.9, course);
                loc.speed = randomTriangular(0.2, 4.25, 1);
                course = loc.course;
            }
            if (client.playerLocationAccuracy >= 65) {
                loc.vertical_accuracy = randomTriangular(35, 100, 65);
                loc.horizontal_accuracy = [client.playerLocationAccuracy, 65, 65, _.random(66, 80, true), 200][_.random(0, 5)];
            } else if (client.playerLocationAccuracy > 10) {
                loc.horizontal_accuracy = client.playerLocationAccuracy;
                loc.vertical_accuracy = [24, 32, 48, 48, 64, 64, 96, 128][_.random(0, 8)];
            } else {
                loc.horizontal_accuracy = client.playerLocationAccuracy;
                loc.vertical_accuracy = [3, 4, 6, 6, 8, 12, 24][_.random(0, 8)];
            }
            loc.timestamp_snapshot = new Date().getTime() - start + _.random(-100, 100);

            lastLocationFix = loc;
            locationFixes.push(loc);
            lastLocationFixTimeStamp = new Date().getTime();
        }
    };
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(updateLocFixes, 900);
    updateLocFixes();

    client.setOption('signatureInfo', function(envelope) {
        let infos: any = {};

        if (locationFixes.length > 0) {
            infos.location_fix = locationFixes;
            locationFixes = [];
        } else {
            infos.location_fix = [lastLocationFix];
        }
        envelope.ms_since_last_locationfix = new Date().getTime() - lastLocationFixTimeStamp;

        infos.device_info = {
                                device_id: config.device.id,
                                device_brand: 'Apple',
                                device_model: 'iPhone',
                                device_model_boot: 'iPhone8,1',
                                hardware_manufacturer: 'Apple',
                                hardware_model: 'N71AP',
                                firmware_brand: 'iOS',
                                firmware_type: '10.2.1',
                            };

        infos.activity_status = {
                                    stationary: true,
                                };

        infos.sensor_info = [{
            timestamp_snapshot: (lastLocationFixTimeStamp - start) + _.random(-800, 800), // close to last location update
            linear_acceleration_x: randomTriangular(-1.7, 1.2, 0),
            linear_acceleration_y: randomTriangular(-1.4, 1.9, 0),
            linear_acceleration_z: randomTriangular(-1.4, .9, 0),
            magnetic_field_x: randomTriangular(-54, 50, 0),
            magnetic_field_y: randomTriangular(-51, 57, -4.8),
            magnetic_field_z: randomTriangular(-56, 43, -30),
            magnetic_field_accuracy: [-1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2][_.random(0, 7)],
            attitude_pitch: randomTriangular(-1.5, 1.5, 0.4),
            attitude_yaw: randomTriangular(-3.1, 3.1, .198),
            attitude_roll: randomTriangular(-2.8, 3.04, 0),
            rotation_rate_x: randomTriangular(-4.7, 3.9, 0),
            rotation_rate_y: randomTriangular(-4.7, 4.3, 0),
            rotation_rate_z: randomTriangular(-4.7, 6.5, 0),
            gravity_x: randomTriangular(-1, 1, 0),
            gravity_y: randomTriangular(-1, 1, -.2),
            gravity_z: randomTriangular(-1, .7, -0.7),
            status: 3,
        }];

        return infos;
    });
};
