describe("单元测试的范例", function() {
  beforeEach(module('app'));
  // 这里可以注入服务或控制器
  // beforeEach(inject(function(_service_) {
  //
  // }));
  it("1当然要等于1", function() {
    expect(1).toBe(1);
  });
});