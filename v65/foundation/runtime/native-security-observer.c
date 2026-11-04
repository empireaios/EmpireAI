/* Qualification-only, read-only observation in the calling protected process.
 * The application and its pinned isolation library are not modified.
 * Node-API v1's exported C ABI is deliberately used without downloaded headers.
 * These four stable declarations match node/src/js_native_api{,_types}.h.
 * No setter, privilege operation, process launch or network operation is exposed.
 */
#include <stddef.h>
#include <stdint.h>
#include <sys/prctl.h>
typedef struct napi_env__ *napi_env;
typedef struct napi_value__ *napi_value;
typedef struct napi_callback_info__ *napi_callback_info;
typedef int napi_status;
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
extern napi_status napi_create_int32(napi_env, int32_t, napi_value *);
extern napi_status napi_create_function(napi_env, const char *, size_t, napi_callback, void *, napi_value *);
extern napi_status napi_throw_error(napi_env, const char *, const char *);

static napi_value current_dumpability(napi_env env, napi_callback_info info) {
    (void)info;
    const int value = prctl(PR_GET_DUMPABLE, 0L, 0L, 0L, 0L);
    napi_value result = NULL;
    if (value < 0 || napi_create_int32(env, value, &result) != 0) {
        napi_throw_error(env, "DUMPABILITY_OBSERVATION_FAILED", "DUMPABILITY_OBSERVATION_FAILED");
        return NULL;
    }
    return result;
}

__attribute__((visibility("default"))) int32_t node_api_module_get_api_version_v1(void) { return 1; }
__attribute__((visibility("default"))) napi_value napi_register_module_v1(napi_env env, napi_value exports) {
    (void)exports;
    napi_value result = NULL;
    if (napi_create_function(env, "currentDumpability", 18, current_dumpability, NULL, &result) != 0) {
        napi_throw_error(env, "OBSERVER_MODULE_INIT_FAILED", "OBSERVER_MODULE_INIT_FAILED");
        return NULL;
    }
    return result;
}
