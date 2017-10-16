import { PmConsolePage } from './app.po';

describe('pm-console App', function() {
  let page: PmConsolePage;

  beforeEach(() => {
    page = new PmConsolePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
