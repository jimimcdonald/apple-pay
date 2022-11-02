<?php

// Gateway merchant credentials.
$merchant_id = 119837;
$key = '9GXwHNVC87VqsqNM';
// Gateway URL  .
$url = 'https://gw1.tponlinepayments.com/direct/';

// Send ApplePay token in request to gateway.

// First get the payment token data.
$payment_token = json_decode($_POST['payment'], true);

// Build the gateway request. Fields such as amount should match the ApplePay request.
$request = array(
	'merchantID' => $merchant_id,
	'action' => 'SALE',
	'amount' => '2.99',
	'countryCode' => '826',
	'currencyCode' => '826',
	'transactionUnique' => 'APPLEPAYTESTING' . uniqid(),
	'type' => '1',
	'duplicateDelay' => 0,
	'paymentMethod' => 'applepay',
	'paymentToken' => json_encode($payment_token['token']['paymentData']),
);

// Create the signature using the function called below.
$request['signature'] = create_signature($request, $key);

// Initiate and set curl options to post to the gateway
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($request));
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Send the request and parse the response
parse_str(curl_exec($ch), $response);

// Close the connection to the gateway
curl_close($ch);

// Return back to the ApplePay javascript the gateway response.
// The Javascript expects a true or false value in the success field.
$gateway_response = array(
	'success' => ((int)$response['responseCode'] === 0),
	'gatewayResponse' => print_r($response, true),
);

// Return the response json encoded for ApplePay Javascript to
// complete the transaction.
echo json_encode($gateway_response);


/**
 * Create Signature.
 *
 * This method will genate a signature for the gateway.
 *
 * @param		array		$data		Gateway request
 * @param		string		$key		Merchant secret
 * @return		string					Calculated signature
 */
function create_signature(array $data, $key) {
	// Sort by field name
	ksort($data);
	// Create the URL encoded signature string
	$ret = http_build_query($data, '', '&');
	// Normalise all line endings (CRNL|NLCR|NL|CR) to just NL (%0A)
	$ret = str_replace(array('%0D%0A', '%0A%0D', '%0D'), '%0A', $ret);
	// Hash the signature string and the key together
	return hash('SHA512', $ret . $key);
}

?>
