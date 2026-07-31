# Mock Module (Mountebank Only)

`qe-framework-core/mock` now supports API recording and playback through Mountebank only.

## Supported mode flags

- `MOCK_MOUNTEBANK=true`
- `MOCK_RECORD=true` or `MOCK_PLAYBACK=true`
- `MOCK_MOUNTEBANK_TARGET_URL=<upstream>` (required for record mode)
- `MOCK_MOUNTEBANK_ADMIN_HOST` (default `127.0.0.1`)
- `MOCK_MOUNTEBANK_ADMIN_PORT` (default `2525`)
- `MOCK_MOUNTEBANK_IMPOSTER_PORT` (default `4545`)

Recorded imposters are saved as:

`app/test_data_mock_data/mountebank-imposter-<scenario>.json`

## Active classes

- `mountebank-mock-manager.js`
- `network-record-playback-manager.js`
- `component-test-helper.js`
