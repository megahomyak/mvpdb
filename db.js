let makeMVPDB = bitStorage => {
    let { read, write, commit } = bitStorage;
    const ptrSize = 50;
    const staticStateValidityFlagPtrPtr = 0;
    const dataTreeRootPtrPtr = staticStateValidityFlagPtrPtr + 1;
    const freesQueueBeginningPtrPtr = dataTreeRootPtrPtr + ptrSize;
    const eofPtrPtr = freesQueueBeginningPtrPtr + ptrSize;
    const transactionBeginningPtrPtr = eofPtrPtr + ptrSize;
    const stateCopyPtrPtr = transactionBeginningPtrPtr + ptrSize;
    const dynamicStatePtrPtr = stateCopyPtrPtr * 2 - dataTreeRootPtrPtr;
    let processCurrentState = ctx => {

    };
    return {
        get: () => {},
        resetTransaction: () => {},
        add: () => {},
        remove: () => {},
        commit: () => {},
    };
};
