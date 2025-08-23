import * as WebBrowser from 'expo-web-browser';

export const openPrivacyPolicy = async () => {
  const privacyPolicyUrl = 'https://grizzled-circle-af0.notion.site/Privacy-Policy-258f3990b6d780e9b65ff065d3025aee';
  await WebBrowser.openBrowserAsync(privacyPolicyUrl);
};

export const openTermsOfService = async () => {
  const termsOfServiceUrl = 'https://grizzled-circle-af0.notion.site/Terms-of-Service-258f3990b6d780ea9e17c08f300c8a43';
  await WebBrowser.openBrowserAsync(termsOfServiceUrl);
};

