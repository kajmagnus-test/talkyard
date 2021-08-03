/// <reference path="../test-types.ts"/>

import * as _ from 'lodash';
import assert = require('../utils/ty-assert');
import fs = require('fs');
import server = require('../utils/server');
import utils = require('../utils/utils');
import { TyE2eTestBrowser } from '../utils/pages-for';
import settings = require('../utils/settings');
import make = require('../utils/make');
import logAndDie = require('../utils/log-and-die');
import c = require('../test-constants');

let maria: Member;
let mariasBrowser: TyE2eTestBrowser;
let strangersBrowser: TyE2eTestBrowser;

let idAddress: IdAddress;
let siteId: any;

const mariasCommentOne = 'mariasCommentOne';
const mariasCommentTwo = 'mariasCommentTwo';

const localHostname = 'comments-for-e2e-test-embscrl-localhost-8080';
const embeddingOrigin = 'http://e2e-test-embscrl.localhost:8080';
//const pageShortSlug = 'emb-cmts-short.html';
const pageTallSlug = 'emb-cmts-tall.html';
const pageTallUrl = embeddingOrigin + '/' + pageTallSlug;
const pageTallerSlug = 'emb-cmts-taller.html';
const pageTallerUrl = embeddingOrigin + '/' + pageTallerSlug;

const tallPagePx = 2500;
const tallerPagePx = 5500;

// Monitors aren't taller than 2000 px?
const minScroll = tallPagePx - 2000;


describe(`embedded-comments-scroll-embedding-page.test.ts  TyT2K4DHR49`, () => {

  it(`initialize people`, () => {
    mariasBrowser = new TyE2eTestBrowser(wdioBrowser);;
    maria = make.memberMaria();
  });

  it(`import a site`, () => {
    const site: SiteData = make.forumOwnedByOwen('embscrl', { title: "Emb Cmts Scroll Test" });
    site.meta.localHostname = localHostname;
    site.settings.allowEmbeddingFrom = embeddingOrigin;
    site.members.push(maria);
    idAddress = server.importSiteData(site);
    siteId = idAddress.id;
  });

  it(`create two embedding pages`, () => {
    const dir = 'target';
    //fs.writeFileSync(`${dir}/${pageShortSlug}`, makeHtml('short', 0, '#005'));
    fs.writeFileSync(`${dir}/${pageTallSlug}`, makeHtml('tall', tallPagePx, '#405'));
    fs.writeFileSync(`${dir}/${pageTallerSlug}`, makeHtml('taller', tallerPagePx, '#040'));
  });


  function makeHtml(pageName: string, extraHeight: number, bgColor: string): string {
    return `
<html>
<head>
<title>Embedded comments E2E test</title>
</head>
<body style="background: ${bgColor}; color: #ccc; font-family: monospace">
<p>Embedded comments E2E test page ${pageName}, and extra heigth: ${extraHeight}.<br>
Ok to delete.</p>
<div style="min-height:${extraHeight}px;">
<br><br>Extra height here.
${ extraHeight > 500 ? "<br><br><i>SCROLL DOWN\n:\n:\n:</i>" : ""}
<br><br>
</div>
<p>The comments: ("long ago" generated by the admin js bundle [2JKWTQ0])</p>

<script>talkyardCommentsServerUrl='${settings.scheme}://${localHostname}.localhost';</script>
<script async defer src="${settings.scheme}://${localHostname}.localhost/-/talkyard-comments.js"></script>
<div class="talkyard-comments" data-discussion-id="extra_height_${extraHeight}"
  style="margin-top: 45px;">

<p>/End of page.</p>
</body>
</html>`;
  }


  it(`Maria opens a tall embedding page`, () => {
    mariasBrowser.go2(pageTallUrl);
  });

  addTestsThatCheckWontScroll('A: ');

  function addTestsThatCheckWontScroll(prefix: St) {
    it(prefix + "... Ty does *not* scroll the comments into view", () => {
      assert.not(mariasBrowser.isDisplayedInViewport('.ty_CmtsIfr'));
    });

    it(prefix + "Maria waits for the comments to load", () => {
      mariasBrowser.switchToEmbeddedCommentsIrame();
      mariasBrowser.metabar.waitForDisplayed();
      mariasBrowser.switchToTheParentFrame();
      // Weird, fails:  assert.ok(mariasBrowser.isVisible('.ty_CmtsIfr'));
      // although it's there already. Chromedriver or Webdriverio bug?
      // Works:
      mariasBrowser.waitForVisible('.ty_CmtsIfr');
    });

    it(prefix + "... Ty still didn't scroll down to the comments", () => {
      assert.not(mariasBrowser.isDisplayedInViewport('.ty_CmtsIfr'));
    });

    it(prefix + "... the browser scroll-top is still 0", () => {
      assert.eq(mariasBrowser.getHtmlBodyScrollY(), 0);
    });
  }


  it(`Maria logs in  TyT2K4DHR49-02`, () => {
    mariasBrowser.switchToEmbeddedCommentsIrame();
    // No:
    // mariasBrowser.loginWithPasswordViaMetabar(maria);
    // Instead, so can set 'maybeMoves'.
    mariasBrowser.metabar.waitForLoginButtonVisible();
    // But why won't the first click work? Need to try twice, why? Oh well.
    utils.tryUntilTrue("Click Login", 3, () => {
      mariasBrowser.metabar.clickLogin({ maybeMoves: true });  // we're scrolling down
      return mariasBrowser.waitForMinBrowserTabs(2, {
              timeoutIsFine: true, timeoutMs: 500 });
    });
    mariasBrowser.loginDialog.loginWithPasswordInPopup(maria);
  });

  it(`... posts a comment`, () => {
    mariasBrowser.complex.replyToEmbeddingBlogPost(
          "To scroll, or not to scroll, that is the question");
  });

  let commentOneUrl: St;

  it(`... copies a link to the comment`, () => {
    mariasBrowser.topic.openShareDialogForPostNr(c.FirstReplyNr);
    commentOneUrl = mariasBrowser.shareDialog.getLinkUrl();
    mariasBrowser.shareDialog.close();
  });

  it(`... the link looks fine: ends with #comment-1`, () => {
    assert.eq(commentOneUrl, pageTallUrl + '#comment-1')
  });


  it(`Maria temp-jumps to another page`, () => {
    // If stayign on the same page, sometimes the browser won't notice
    // that the URL hash frag got changed — at least when editing it outside a test.
    // So, go to a different page in between.
    mariasBrowser.go2(pageTallerUrl);
  });

  it(`... then pastes the link to the comment, goes there`, () => {
    mariasBrowser.go2(commentOneUrl);
  });

  it(`Now, Ty *does* scroll the comments section into view  TyT2K4DHR49-05`, () => {
    mariasBrowser.waitForDisplayedInViewport('.ty_CmtsIfr');
    assert.ok(mariasBrowser.getHtmlBodyScrollY() >= minScroll);
  });


  it(`Maria goes to the other page again`, () => {
    mariasBrowser.go2(pageTallerUrl);
  });

  it(`... then pastes the link to the page with the comment
          — but *without* the #comment- hash`, () => {
    mariasBrowser.go2(pageTallUrl);
  });

  addTestsThatCheckWontScroll('B: ');



  // TESTS_MISSING  Show and scroll to the correct comment,
  // in a 300 comments long discussion?


  /*
  Hmm never auto scroll to the last read pos, for a blog post?
  So, never this:

  function markCommentsRead() {
    mariasBrowser.execute(function() {
      localStorage.setItem('debikiPostNrsReadByPageId', "{\"1\":[2,3],\"2\":[2,3]}");
    });
  }

  it("... and reads comments 1 and 2 (posts 2 and 3)", () => {
    //markCommentsRead();
  });

  it("She reloads the page", () => {
  });

  it("... it won't auto-scroll to last reading position (reading the blog post = higher prio)", () => {
  });
  */


});

