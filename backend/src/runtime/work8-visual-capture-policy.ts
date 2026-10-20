/** Explicitly disabled Pillow has no visual engine to capture. Enabled Pillow
 * must still provide its real lock/snapshot; startup failures must propagate. */
export function withConfiguredVisualCapture<T>(enabled:boolean,host:{withVisualMemoryRecoveryCapture<R>(capture:(snapshot:unknown)=>Promise<R>):Promise<R>},capture:(snapshot?:unknown)=>Promise<T>):Promise<T>{
 return enabled ? host.withVisualMemoryRecoveryCapture(capture) : capture(undefined);
}
