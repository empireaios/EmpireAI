import {createRequire} from 'node:module';
const adapter=createRequire(import.meta.url)('../../../deployment/observer-capture.cjs') as {withObserverCapture:<T>(capture:()=>Promise<T>)=>Promise<T>};
export const withSupervisedObserverCapture=adapter.withObserverCapture;
