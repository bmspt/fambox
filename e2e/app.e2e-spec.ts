import { FamboxPage } from './app.po';

describe('fambox App', () => {
  let page: FamboxPage;

  beforeEach(() => {
    page = new FamboxPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
