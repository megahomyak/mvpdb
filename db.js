let makeMVPDB = bitStorage => {
    let makeStruct = initializer => baseAddr => initializer((() => {
        return fieldSize => {
            let oldTotalBias = baseAddr;
            baseAddr += fieldSize;
            return () => oldTotalBias;
        };
    })());

    let dataSlot = () => array(pointer(dataSlot()));
    let freeSlot = () => struct(field => ({
        next: field(pointer(freeSlot())),
    }));
    let transactionSlot = () => struct(field => ({
        next: field(pointer(freeSlot())),
        data: field(enum_(variant => ({
            bit0: variant(),
            bit1: variant(),
            removal: variant(),
            insertion: variant(),
        }))),
    }));
    let staticState = struct(field => ({
        activeVariantIndex: field(bool()),
        variants: field(array(struct(field => ({
            dataTree: field(pointer())
        })))),
    }));

    // ---------
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
