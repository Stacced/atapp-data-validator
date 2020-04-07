const constraints = {
    date: {
        presence: {
            allowEmpty: false
        },
        datetime: {
            dateOnly: true
        }
    },
    email: {
        presence: {
            allowEmpty: false
        },
        email: true
    },
    avs: {
        presence: {
            allowEmpty: false
        },
        avs: true,
        format: {
            pattern: "756\.?[0-9]{4}\.?[0-9]{4}\.?[0-9]{2}",
            flags: "i",
            message: "is not correctly formatted"
        },
        length: {
            is: 16
        }
    },
    phone: {
        presence: {
            allowEmpty: false
        },
        phone: true
    },
    iban: {
        presence: {
            allowEmpty: false
        },
        iban: true
    },
    bvr: {
        presence: {
            allowEmpty: false
        },
        bvr: true,
        length: {
            is: 27
        }
    },
    richtext: {
        presence: {
            allowEmpty: false
        },
        richtext: true
    }
};

module.exports = constraints;