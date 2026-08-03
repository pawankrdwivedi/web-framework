// Generated from: test-results\generated-features\ui\demo-app.feature
import { default as test } from "../../../../src/support/world.js";

test.describe('Demo App E2E Tests', () => {

  test('User can login and view the dashboard', { tag: ['@ui', '@demo-app'] }, async ({ Given, Then, And, pageManager }) => { 
    await Given('user navigates to the Demo App page', null, { pageManager }); 
    await And('user logs in with "admin" and "password"', null, { pageManager }); 
    await Then('the user should see the dashboard with stats', null, { pageManager }); 
  });

  test('User can view products', { tag: ['@ui', '@demo-app'] }, async ({ Given, Then, And, pageManager }) => { 
    await Given('user navigates to the Demo App page', null, { pageManager }); 
    await And('user navigates to the Demo App products page', null, { pageManager }); 
    await Then('the user should see a list of products', null, { pageManager }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks }) => $runScenarioHooks('before', {  }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks }) => $runScenarioHooks('after', {  }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('test-results\\generated-features\\ui\\demo-app.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":4,"tags":["@ui","@demo-app"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given user navigates to the Demo App page","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"And user logs in with \"admin\" and \"password\"","stepMatchArguments":[{"group":{"start":18,"value":"\"admin\"","children":[{"start":19,"value":"admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"},{"group":{"start":30,"value":"\"password\"","children":[{"start":31,"value":"password","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":7,"keywordType":"Outcome","textWithKeyword":"Then the user should see the dashboard with stats","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":10,"tags":["@ui","@demo-app"],"steps":[{"pwStepLine":13,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given user navigates to the Demo App page","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"And user navigates to the Demo App products page","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the user should see a list of products","stepMatchArguments":[]}]},
]; // bdd-data-end