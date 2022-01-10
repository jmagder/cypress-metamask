/// <reference types="cypress" />
// import helpers from "../support/helpers";
require('dotenv').config()
const helpers = require('../support/helpers')
const puppeteer = require('../support/puppeteer');
const metamask = require('../support/metamask');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('before:browser:launch', async (browser = {}, arguments_) => {
    console.log('Loading MetaMask Extension')
    if (browser.name === 'chrome' && browser.isHeadless) {
      console.log('TRUE'); // required by cypress ¯\_(ツ)_/¯
      arguments_.args.push('--window-size=1920,1080');
      return arguments_;
    }

    if (browser.name === 'electron') {
      arguments_.preferences['width'] = 1920;
      arguments_.preferences['height'] = 1080;
      arguments_.preferences['resizable'] = false;
      return arguments_;
    }

    // metamask welcome screen blocks cypress from loading
    if (browser.name === 'chrome') {
      arguments_.args.push(
        // '--auto-open-devtools-for-tabs',
        '--remote-debugging-port=9222',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      );
    }

    // NOTE: extensions cannot be loaded in headless Chrome
    const metamaskPath = await helpers.prepareMetamask(
      process.env.METAMASK_VERSION || '9.4.0',
    );
    arguments_.extensions.push(metamaskPath);
    return arguments_;
  });


  on('task', {
    error(message) {
      console.error('\u001B[31m', 'ERROR:', message, '\u001B[0m');
      return true;
    },
    warn(message) {
      console.warn('\u001B[33m', 'WARNING:', message, '\u001B[0m');
      return true;
    },
    async initPuppeteer() {
      const connected = await puppeteer.init();
      return connected;
    },
    async assignWindows() {
      const assigned = await puppeteer.assignWindows();
      return assigned;
    },
    async switchToCypressWindow() {
      const switched = await puppeteer.switchToCypressWindow();
      return switched;
    },
    async switchToMetamaskWindow() {
      const switched = await puppeteer.switchToMetamaskWindow();
      return switched;
    },
    async switchToMetamaskNotification() {
      const notificationPage = await puppeteer.switchToMetamaskNotification();
      return notificationPage;
    },
    async confirmMetamaskWelcomePage() {
      const confirmed = await metamask.confirmWelcomePage();
      return confirmed;
    },
    async unlockMetamask(password) {
      if (process.env.PASSWORD) {
        password = process.env.PASSWORD;
      }
      const unlocked = await metamask.unlock(password);
      return unlocked;
    },
    async importMetamaskWallet({ secretWords, password }) {
      if (process.env.SECRET_WORDS) {
        secretWords = process.env.SECRET_WORDS;
      }
      if (process.env.PASSWORD) {
        password = process.env.PASSWORD;
      }
      const imported = await metamask.importWallet(secretWords, password);
      return imported;
    },
    async importMetaMaskWalletUsingPrivateKey({ key, handleDuplicates }) {
      await puppeteer.switchToMetamaskWindow();
      const imported = await metamask.importMetaMaskWalletUsingPrivateKey(key, handleDuplicates);
      await puppeteer.switchToMetamaskWindow();
      return imported
    },
    
    async addMetamaskNetwork(network) {
      const networkAdded = await metamask.addNetwork(network);
      return networkAdded;
    },
    async changeMetamaskNetwork(network = process.env.NETWORK_NAME || 'kovan') {
      const networkChanged = await metamask.changeNetwork(network);
      return networkChanged;
    },
    async acceptMetamaskAccess() {
      const accepted = await metamask.acceptAccess();
      return accepted;
    },
    async confirmMetamaskTransaction({ skipGasFee }) {
      const confirmed = await metamask.confirmTransaction(skipGasFee);
      return confirmed;
    },
    async rejectMetamaskTransaction() {
      const rejected = await metamask.rejectTransaction();
      return rejected;
    },
    async getMetamaskWalletAddress() {
      const walletAddress = await metamask.getWalletAddress();
      return walletAddress;
    },
    async fetchMetamaskWalletAddress() {
      return metamask.walletAddress();
    },
    async setupMetamask({ secretWords, network, password, forceNewSession = false }) {
      console.log(`setupMetamask - forceNewSession: ${forceNewSession}`)
      if (!forceNewSession && puppeteer.metamaskWindow()) {
        await puppeteer.switchToCypressWindow();
        return true
      } else {
        if (process.env.NETWORK_NAME) {
          network = process.env.NETWORK_NAME;
        }
        if (process.env.SECRET_WORDS) {
          secretWords = process.env.SECRET_WORDS;
        }
        if (process.env.PASSWORD) {
          password = process.env.PASSWORD;
        }
        await metamask.initialSetup({ secretWords, network, password });
        return true;
      }
    },

    async changeAccount(number) {
      console.log(`JEFF - plugins.index.changeAccount 2 - 1 - requested number: ${number}`)
      await puppeteer.switchToMetamaskWindow();
      await puppeteer.metamaskWindow().waitForTimeout(1000);
      console.log("JEFF - changeAccount 2 - 2")
      await metamask.changeAccount(number);
      await puppeteer.metamaskWindow().waitForTimeout(500);
      console.log("JEFF - changeAccount 2 - 3")
      await puppeteer.switchToCypressWindow();
      console.log("JEFF - changeAccount 2 - 4")
      return null
    },

    async acceptSignature() {
      console.log("plugin Accept Signature");
      await puppeteer.switchToMetamaskWindow();
      await puppeteer.metamaskWindow().waitForTimeout(1000);
      await metamask.acceptSignature();
      await puppeteer.metamaskWindow().waitForTimeout(500);
      await puppeteer.switchToCypressWindow();
      return true;
    },

    async signTypedData({ accept }) {
      console.log("Sign Typed Data called");
      await puppeteer.switchToMetamaskWindow();
      await puppeteer.metamaskWindow().waitForTimeout(1000);
      await metamask.signTypedData(accept);
      await puppeteer.metamaskWindow().waitForTimeout(500);
      await puppeteer.switchToCypressWindow();
      return true;
    },

    getNetwork() {
      const network = helpers.getNetwork();
      return network;
    },
    async addNetwork() {
      const network = metamask.addNetwork();
      return network;
    }
  });

  return config;
}
