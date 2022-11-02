<?php

// ApplePay config.
$apw_merchant_identifier  = 'merchant.takepayments.test';
$apw_domain_name          = 'https://dev.bee-online.com/';
$apw_display_name         = 'takepayments test';
$apw_certificate_path 	  = 'merchantcertificate.pem';
$apw_certificate_key      = 'merchantcertificate.key';
// If your merchant certificate key uses a password uncomment the line below and line 23.
// $apw_certificate_key_pass = 'Your certificate key password here if used.';

$validation_url = $_POST['validationURL'];

// echo var_dump($_POST);

if ("https" === parse_url($validation_url, PHP_URL_SCHEME) && substr(parse_url($validation_url, PHP_URL_HOST), -10) === ".apple.com") {

	$ch = curl_init();

	$data = '{"merchantIdentifier":"' . $apw_merchant_identifier . '", "domainName":"' . $apw_domain_name . '", "displayName":"' . $apw_display_name . '"}';

	curl_setopt($ch, CURLOPT_URL, $validation_url);
	curl_setopt($ch, CURLOPT_SSLCERT, $apw_certificate_path);
	curl_setopt($ch, CURLOPT_SSLKEY, $apw_certificate_key);
	// curl_setopt($ch, CURLOPT_SSLKEYPASSWD, $apw_certificate_key_pass);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response = curl_exec($ch);

	curl_close($ch);
	// echo "Url is good";
	// echo $data;
	echo $response;

} else {
	die('url is bad, it\'s not ssl or contains .apple.com');
}

?>
