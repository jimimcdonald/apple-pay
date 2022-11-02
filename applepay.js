
debugOn = true;
debugToConsole = true;
const merchantValidationURL = 'validate-merchant.php';
const transactionProcessURL = 'process-token.php';
const ApplePayVersion = 4
// On window load check if ApplePay is enabled and can make payments.
// If it is and can then enable the payment option
window.onload = function () {
    log('Checking if ApplePay is enabled and can make payments');
    if (isApplePayEnabled()) {
        log('ApplePay is enabled and can make payments');
        // Display the apple pay button if enabled and can make payments.
        document.getElementById('applepay-button-container').style.display = 'block';
    } else {
        log("ApplePay is not available on this device or can't make payments");
    }
}
/**
 * Apple Pay button
 *
 * Runs when the ApplePay button is clicked.
 */
function applePayButtonClicked() {
    log("ApplePay button clicked")
    if (isApplePayEnabled()) {
        log("Setting up ApplePay session");
        var session = new ApplePaySession(ApplePayVersion, buildApplePayRequest());
        log('Begin session');
        session.begin();
    } else {
        log('Apple Pay button was clicked but apple pay is not enabled')
    }
    /**
     * Apple Pay Session - On Validate Merchant
     *
     * Ensures that the merchant identifier being used to conduct the
     * transaction is known and confirmed by ApplePaySession as a
     * legitimate merchant.
     *
     * After the session begins onvalidatemerchant is called by the
     * ApplePay session
     *
     * @param {*} event
     * @returns
     */
    session.onvalidatemerchant = function (event) {
        log('session.onvalidatemerchant() - event: ', event);
        var promise = performValidation(event.validationURL);
        promise.then(function (merchantSession) {
            session.completeMerchantValidation(merchantSession);
            log("merchant session response" + JSON.stringify(merchantSession));
        }).catch(function (err) {
            log('session.onvalidatemerchant - failure: ', err);
        });
    };
    session.onpaymentauthorized = function (event) {
        log('Session.onpaymentauth triggered', event);
        var promise = processPayment(event.payment);
        promise.then(function (response) {
            log('Gateway response - ', response);
            try {
                var result = {
                    status: (response.success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE),
                };
                // If the gateways response was not a success then output the error.
                if (!response.success) {
                    result.errors = [new ApplePayError('unknown', 'name', response.message)];
                } else {
                    // Otherwise complete the payment
                    log('Completing payment')
                    session.completePayment(result.status)
                    log("Complete")
                }
            } catch (error) {
                log('Error completing payment: ', error);
            }
        }).catch(function (err) {
            log('session.onpaymentauthorised() - failed: ', err);
        });
    }
    /**
     * Apple Pay Session - On Cancel
     * @param {} event
     */
    session.oncancel = function (event) {
        log('Session canceled', event);
    };
}
/**
 * Is Apple Pay Enabled
 *
 * Checks if apple pay is enabled and can make payments
 * If it can make payments return true otherwise return
 * false
 *
 * @returns bool
 */
function isApplePayEnabled() {
    // If ApplePaySession is undefined or null then Applepay is not available on this device
    if (typeof ApplePaySession === 'undefined' || ApplePaySession === null) {
        // Disable applepay enabled flags.
        applePayEnabledOnDevice = false;
        applePayCanMakePayments = false;
        log('ApplePay Session not available. Either this is not an Apple Device or payment not available');
    } else if (ApplePaySession) {
        log('Apple pay is enabled on this device');
        applePayEnabledOnDevice = true;
        // Else if ApplePaySession is enabled then check if ApplePay can make payments
        if (applePayCanMakePayments = ApplePaySession.canMakePayments()) {
            log("Apple Pay can make payments");
        }
    }
    // Return enabled and can make payments as single bool.
    return applePayCanMakePayments && applePayCanMakePayments;
}
/**
 * Build Apple Pay Request
 *
 * Builds an applepay request object by collecting the order
 * details. Normally this would be dynmaic data but for the
 * purpose of the sample code this is a hard coded request to
 * give an idea of what the request would look like.
 *
 * @returns
 */
function buildApplePayRequest() {
    log('buildApplePayRequest() - Building ApplePayRequest');
    paymentRequest = {
        currencyCode: 'GBP',
        countryCode: 'GB',
        requiredBillingContactFields: ['email', 'name', 'phone', 'postalAddress'],
        requiredShippingContactFields: ['email', 'name', 'phone', 'postalAddress'],
        lineItems: [{ label: 'test item', amount: '2.99' }],
        total: {
            label: 'Total label',
            amount: '2.99'
        },
        supportedNetworks: [
            "amex",
            "visa",
            "discover",
            "masterCard"
        ],
        merchantCapabilities: ['supports3DS'],
        //applicationData: 'somedatehere'
    }
    log("Apple Pay request sent to apple: " + JSON.stringify(paymentRequest));
    return paymentRequest;
}
/**
 * Perform validation of merchant.
 *
 * This function will call the validation merchant end point.
 * The server will then validate the merchant with ApplePay
 * If it's valid the session continues on. If not session.oncancel
 * is called.
 *
 * @param {} validationURL
 * @returns
 */
function performValidation(validationURL) {
    log('PerformValidationd() - validationURL: ', validationURL);
    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        formData.append('validationURL', validationURL);
        fetch(merchantValidationURL, {
            method: 'POST',
            body: formData
        })
            .then(function (res) {
                log("Validation success" + JSON.stringify(res));
                resolve(res.json());
            })
            .catch(function (err) {
                log('performValidation() - failure: ', err);
                reject(err);
            });
    });
}
/**
 * Process Payment
 *
 * This will send the autheorised ApplePay payment to the
 * gateway transaction processing end point which will then
 * send on the transaction request to the gateway.
 *
 * The end point will then responsed if the transaction was sucessfull
 * or not wich is passed back in a promise
 *
 * @param {*} payment
 * @returns Promise
 */
function processPayment(payment) {
    log('Processing Payment started - payment: ', payment);
    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        formData.append('payment', JSON.stringify(payment));
        fetch(transactionProcessURL, {
            method: 'POST',
            body: formData
        })
            .then(function (res) {
                log('processPayment() - success: result is ', res);
                resolve(res.json());
            })
            .catch(function (err) {
                log('processPayment() - failure: ', err);
                reject(err);
            });
    });
}
/**
 * Logger
 *
 * Outputs logs to the browser and console if debugging
 * options enabled.
 *
 * @param {*} string
 * @param {*} object
 */
function log(string, object = "") {
    browserOutput = document.getElementById("browserOutput");
    if (debugOn) {
            if (debugToConsole) {
                console.log('[ApplePay][' + Date.now() + '] - ' + string, object);
            }
            browserOutput.innerHTML += "<br><br>" + string + (object !== "" ? JSON.stringify(object) : '')
    }
}
