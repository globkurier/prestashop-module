{*
 * 2007-2024 PrestaShop.
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
 * @copyright 2007-2024 PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 *}
<form method="post">
<div class="panel">
    <div class="panel-heading">
        <i class="icon-cogs"></i> {l s='Log in' mod='globkuriermodule'}
    </div>
    <div class="panel-body">
        <div class="row">
            {if $submited}
            <div class="bootstrap">
                <div class="alert alert-danger">
                    <h4>{l s='We coundn\'t log you in with provided data!' mod='globkuriermodule'}</h4>
                    <span>
                      {l s='Please try again. If problem still ocurrs, please contact us:' mod='globkuriermodule'}
                    </span>
                    <button type="button" class="close">×</button>
                </div>
            </div>
            {/if}
            <div class="col-lg-6">
                <img src="{$baseurl|escape:'javascript':'UTF-8'}views/img/logo.png" class="img-responsive">
                <div class="form-horizontal">
                    <div class="form-group">
                        <label class="col-lg-3 control-label">{l s='Login:' mod='globkuriermodule'}</label>
                        <div class="col-lg-6">
                            <input type="text" name="config_login" value="{$config->login|escape:'htmlall':'UTF-8'}" />
                            <p class="help-block">{l s='Your Globkurier login' mod='globkuriermodule'}</p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-lg-3 control-label">{l s='Password' mod='globkuriermodule'}</label>
                        <div class="col-lg-6">
                            <input type="password" name="config_password" value="{$config->password|escape:'htmlall':'UTF-8'}" />
                            <p class="help-block">{l s='Your Globkurier password' mod='globkuriermodule'}</p>
                        </div>
                    </div>

                    {*<div class="form-group">
                        <label class="col-lg-3 control-label">{l s='API key' mod='globkuriermodule'}</label>
                        <div class="col-lg-9">
                            <input type="text" name="config_apiKey" value="{$config->apiKey|escape:'htmlall':'UTF-8'}" />
                            <p class="help-block">{l s='You will find API key in your globkurier account' mod='globkuriermodule'}</p>
                        </div>
                    </div>*}

                    <div class="form-group">
                        <div class="col-lg-9 col-lg-offset-3">
                            <p>
                                {l s='Don\'t have account yet?' mod='globkuriermodule'} <a href="http://globkurier.pl">{l s='Sign in' mod='globkuriermodule'}</a><br/>
                                {l s='Any questions? Contact us:' mod='globkuriermodule'}
                            </p>
                        </div>
                    </div>
                </div>
                
            </div>{* .col-lg-4 *}

            <div class="col-lg-6 globconfig" style="padding: 10px 50px;">
              <h3>{l s='Benefits' mod='globkuriermodule'}: <span style="color: rgb(206, 0, 0);">{l s='Benefits of GlobKurier' mod='globkuriermodule'}:</span></h3>
              <ul style="padding: 10px; font-size: 1.2em; line-height: 25px;">
                <li>{l s='low carrier fees' mod='globkuriermodule'}</li>
                <li>{l s='information about your parcel' mod='globkuriermodule'}</li>
                <li>{l s='fast compare all carries' mod='globkuriermodule'}</li>
                <li>{l s='you can define shipping methods' mod='globkuriermodule'}</li>
                <li>{l s='you can print waybill directly from prestashop' mod='globkuriermodule'}</li>
              </ul>
            </div>{* .col-lg-4 *}
{* 
            <div class="col-lg-4">
              <div style="border: 1px solid rgb(204, 204, 204);" class="col-lg-12 globconfig">
                <h3 style="background-color: rgb(21, 191, 21); border-radius: 10px; color: white; height: 3em; line-height: 3em; padding-left: 15px;">{l s='How to start' mod='globkuriermodule'}</h3>
                <p style="font-size: 1.2em; line-height: 1.8;">
                  {l s='1. Get your API key through' mod='globkuriermodule'}<br>
                  &nbsp;&nbsp;{l s='a) Your current email address in GlobKurier or' mod='globkuriermodule'}<br>
                  &nbsp;&nbsp;{l s='b) Create an account below' mod='globkuriermodule'}<br>
                  {l s='2. Wait for the email with your API key' mod='globkuriermodule'}<br>
                  {l s='3. Complete other account data.' mod='globkuriermodule'}<br>
                  {l s='It’s done !' mod='globkuriermodule'}
                </p>
                
              </div>
              <div class="col-lg-12">
                <p class="text-center" style="margin-top: 20px;">
                  <a href="https://www.globkurier.pl/rejestracja.html" target="_blank" style="background-color: rgb(238, 68, 68); color: white; font-size: 1.3em; font-weight: bold; padding: 6px 50px;" class="btn">{l s='Activate module' mod='globkuriermodule'}</a>
                </p>
              </div>
            </div>.col-lg-4 *}
        </div>{* .row *}

    </div>
    <div class="panel-footer">
        <input type="hidden" name="action" value="updateConfig"/>
        <button type="submit" class="btn btn-default pull-right">
            <i class="process-icon-save"></i> {l s='Save' mod='globkuriermodule'}
        </button>
    </div>
</div>
</form>
