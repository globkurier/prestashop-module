<?php
/**
 * 2007-2025 PrestaShop.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2025 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */
if (!defined('_PS_VERSION_')) {
    exit;
}
/**
 * user data to login to globkurier
 */
$data = ['email' => 'jwo@croen.pl', 'password' => 'MuffinGoCrazy4Times@GK'];

$curl = curl_init('https://api.globkurier.pl/v1/auth/login');
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');

$headers = [];
if (is_array($data) && count($data)) {
    $jsonData = json_encode($data);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $jsonData);
    $headers[] = 'Content-Type: application/json';
    $headers[] = 'Content-Length: ' . Tools::strlen($jsonData);
}

curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($curl);
$resInfo = curl_getinfo($curl);
curl_close($curl);
$r = json_decode($result, true);

var_dump($resInfo);
var_dump($result);
var_dump($r);
