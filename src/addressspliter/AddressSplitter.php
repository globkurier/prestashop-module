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
namespace AddressSplitter;
if (!defined('_PS_VERSION_')) {
    exit;
}
class AddressSplitter
{
    /**
     * @var string
     */
    private $street;

    /**
     * @var string
     */
    private $streetType;

    /**
     * @var string
     */
    private $houseNumber;

    /**
     * @var string
     */
    private $apartmentNumber;

    /**
     * @param $rawAddress
     * @return bool
     */
    public function split($rawAddress)
    {
        $addressParts = $this->parseAddress($rawAddress);
        $arr = [AddressPart::STREET_TYPE, AddressPart::OTHER, AddressPart::NUMBER];
        if ($this->addressPartsMatch($arr, $addressParts)) {
            $this->streetType = (string) $addressParts[0];
            $this->street = (string) $addressParts[1];
            $this->houseNumber = (string) $addressParts[2];
            return true;
        }

        $arr = [AddressPart::STREET_TYPE, AddressPart::OTHER, AddressPart::NUMBER,
                     AddressPart::APARTMENT_SEPARATOR, AddressPart::NUMBER];
        if ($this->addressPartsMatch($arr, $addressParts)) {
            $this->streetType = (string) $addressParts[0];
            $this->street = (string) $addressParts[1];
            $this->houseNumber = (string) $addressParts[2];
            $this->apartmentNumber = (string) $addressParts[4];
            return true;
        }
        $arr = [AddressPart::STREET_TYPE, AddressPart::OTHER, AddressPart::NUMBER, AddressPart::NUMBER,
                     AddressPart::APARTMENT_SEPARATOR, AddressPart::NUMBER];
        if ($this->addressPartsMatch($arr, $addressParts)) {
            $this->streetType = (string) $addressParts[0];
            $this->street = (string) $addressParts[1] . ' ' . (string) $addressParts[2];
            $this->houseNumber = (string) $addressParts[3];
            $this->apartmentNumber = (string) $addressParts[5];
            return true;
        }

        $arr = [AddressPart::OTHER, AddressPart::NUMBER, AddressPart::NUMBER,
                     AddressPart::APARTMENT_SEPARATOR, AddressPart::NUMBER];
        if ($this->addressPartsMatch($arr, $addressParts)) {
            $this->street = (string) $addressParts[0] . ' ' . (string) $addressParts[1];
            $this->houseNumber = (string) $addressParts[2];
            $this->apartmentNumber = (string) $addressParts[4];
            return true;
        }

        if ($this->addressPartsMatch([AddressPart::OTHER, AddressPart::NUMBER], $addressParts)) {
            $this->street = (string) $addressParts[0];
            $this->houseNumber = (string) $addressParts[1];
            return true;
        }
        $arr = [AddressPart::OTHER, AddressPart::NUMBER, AddressPart::APARTMENT_SEPARATOR, AddressPart::NUMBER];
        if ($this->addressPartsMatch($arr, $addressParts)) {
            $this->street = (string) $addressParts[0];
            $this->houseNumber = (string) $addressParts[1];
            $this->apartmentNumber = (string) $addressParts[3];
            return true;
        }
        return false;
    }

    /**
     * @param string $rawAddress
     * @return AddressPart[]
     */
    private function parseAddress($rawAddress)
    {
        /** @var AddressPart[] $parts */
        $parts = [$rawAddress];
        $parts = $this->splitElement(
            $parts,
            '((^|[ ])ul\.)|((^|[ ])ul )|((^|[ ])al\.)|((^|[ ])al )|((^|[ ])pl\.)|((^|[ ])pl )',
            AddressPart::STREET_TYPE
        );
        $parts = $this->splitElement($parts, '(\/)|( m.)', AddressPart::APARTMENT_SEPARATOR);
        do {
            $numberOfPartsBefore = count($parts);
            $parts = $this->splitElement($parts, '[0-9]+[a-zA-Z]*', AddressPart::NUMBER);
        } while ($numberOfPartsBefore != count($parts));
        $parts = $this->convertCommonStringsToPart($parts, AddressPart::OTHER);
        return $parts;
    }

    /**
     * @param array $parts
     * @param string $regex
     * @param int $type
     * @return array
     */
    private function splitElement(array $parts, $regex, $type)
    {
        $splittedParts = [];
        foreach ($parts as $part) {
            if (!is_string($part)) {
                $splittedParts[] = $part;
            } elseif (preg_match('/^(' . $regex . ')$/', $part)) {
                $splittedParts[] = new AddressPart($part, $type);
            } elseif (preg_match('/' . $regex . '/', $part, $found)) {
                list($before, $after) = explode($found[0], $part);
                $elementContent = $found[0];

                $before = trim($before);
                $after = trim($after);

                if (!empty($before)) {
                    $splittedParts[] = $before;
                }
                $splittedParts[] = new AddressPart(trim($elementContent), $type);

                if (!empty($after)) {
                    $splittedParts[] = $after;
                }
            } else {
                $splittedParts[] = $part;
            }
        }
        return $splittedParts;
    }

    /**
     * @param array $parts
     * @param int $type
     * @return array
     */
    private function convertCommonStringsToPart(array $parts, $type)
    {
        foreach ($parts as $index => $value) {
            if (is_string($value)) {
                $parts[$index] = new AddressPart($value, $type);
            }
        }
        return $parts;
    }

    /**
     * @param array $pattern
     * @param array $addressParts
     * @return bool
     */
    private function addressPartsMatch(array $pattern, array $addressParts)
    {
        if (count($pattern) != count($addressParts)) {
            return false;
        }
        return true;
    }

    /**
     * @return string
     */
    public function getStreet()
    {
        return $this->street;
    }

    /**
     * @return string
     */
    public function getStreetType()
    {
        return $this->streetType;
    }

    /**
     * @return string
     */
    public function getHouseNumber()
    {
        return $this->houseNumber;
    }

    /**
     * @return string
     */
    public function getApartmentNumber()
    {
        return $this->apartmentNumber;
    }
}
