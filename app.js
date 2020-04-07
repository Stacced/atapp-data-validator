// Dependencies
const express = require('express');
const portfinder = require('portfinder');
const validate = require('validate.js');
const moment = require('moment');
const IBAN = require('iban');
const constraints = require('./constraints');

// Register IBAN validator
validate.validators.iban = (value, options, key, attributes) => {
    return IBAN.isValid(value) ? undefined : "is invalid";
};

// Register AVS validator
validate.validators.avs = (value, options, key, attributes) => {
    // Convert string chars to individual digits
    const digits = value.toString().replace(/\./g, '').split('').map(Number);
    const controlDigit = digits[digits.length - 1];

    // Compute sums
    let oddSum = 0;
    let evenSum = 0;
    for (let i = 0; i < digits.length - 1; i++) {
        if ((i + 1) % 2 === 0)
            evenSum += digits[i];
        else
            oddSum += digits[i];
    }

    // Compute total AVS number sum
    const avsSum = oddSum + evenSum * 3;

    return avsSum % 10 === controlDigit ? undefined : (avsSum + controlDigit) % 10 === 0 ? undefined : "is invalid"
};

// Register BVR validator
validate.validators.bvr = (value, options, key, attributes) => {
    const keyDigit = Number(value.toString()[value.length - 1]);
    const referenceNumber = value.toString().slice(0, -1);

    return keyDigit === moduloTenRecursive(referenceNumber) ? undefined : "is invalid (passed key digit and computed one don't match)";
};

// Register rich text validator
validate.validators.richtext = (value, options, key, attributes) => {
    return !containsScript(value) ? undefined : "can't include <script>";
};

// Register phone number validator
validate.validators.phone = (value, options, key, attributes) => {
    // TODO: Check phone number (FR / CH)
    return 'is invalid';
};

// Extend validate for date
validate.extend(validate.validators.datetime, {
    parse: (value, options) => {
        return +moment.utc(value);
    },

    format: (value, options) => {
        const format = options.dateOnly ? "DD-MM-YYYY" : "DD-MM-YYYY hh:mm:ss";
        return moment.utc(value).format(format);
    }
});

// Instantiate Express server
const app = express();

// Support JSON encoded bodies
app.use(express.json());

// Serve static content
app.use(express.static(__dirname));

// Serve validation api
app.post('/api/validate', (req, res) => {
    // Get data from request body
    const date = req.body.date;
    const email = req.body.email;
    const avs = req.body.avs;
    const phone = req.body.phone;
    const iban = req.body.iban;
    const bvr = req.body.bvr;
    const richtext = req.body.richtext;

    // Validate
    const errors = (validate({
        date: date,
        email: email,
        avs: avs,
        phone: phone,
        iban: iban,
        bvr: bvr,
        richtext: richtext
    }, constraints));

    // Return errors in JSON
    res.json({'errors': errors});
});

// Listen on first available port
portfinder.getPortPromise()
    .then(foundPort => {
        let server = app.listen(foundPort, () => {
            const host = server.address().address;
            const port = server.address().port;
            console.log('App listening at http://%s:%s', host, port);
        });
    })
    .catch(err => {
        console.error("Can't find available port within %s and %s", portfinder.basePort, portfinder.highestPort);
    });

/*
FUNCTIONS
 */
/**
 * Function for generating ESR-numbers for orange swiss payment slips (so called "Oranger Einzahlungsschein").
 * https://gist.github.com/NicolasZanotti/9448291
 * @author Jason Rubichi, Nicolas Zanotti
 * @param
 *    bc: fix, 01 or 04
 *    chf: dynamic, amount in chf without rappen, must have eight chars minimum (if less than eight chars, insert zeros before)
 *    rappen: dynamic, amount in rappen
 *    help1, help2, help3: fix, "+" or ">", no editing required
 *    referenceNumber: dynamic, contains matag number, zeros, client number and job number
 *    participantNumber: dynamic, bankaccount number
 *
 * @usage generateCodeline("01", "4378", "85", ">", "94476300000000128001105152", "+", "01200027", ">");
 */
function moduloTenRecursive(number) {
    let table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
    let carryover = 0;
    let numbers = number.split("");

    for (let i = 0, j = 0; i < numbers.length; i++) {
        j = parseInt(carryover, 10) + parseInt(numbers[i], 10);
        carryover = table[j % 10];
    }

    return (10 - carryover) % 10;
}

/**
 * Returns whether or not a given HTML string contains <script> tags
 * @param s HTML string
 * @returns {boolean}
 */
function containsScript(s) {
    return s.includes('script');
}