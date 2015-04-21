module.exports = function() {
  this.title = function() {
    return browser.getTitle();
  };
  this.name = element(by.id('name'));
  this.nameEcho = element(by.id('name-echo'));
  this.clear = element(by.id('clear'));
  this.get = function() {
    browser.get('http://localhost:5000/#/');
  };
};
