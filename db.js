let makeMVPDB = bitStorage => {
    /*UNLIKELY:
    let pointer = pointee => ({
        size: 50,
        make: addr => pointee(addr),
    });*/

    let union = variantProducer => addr => {
        let maxSize = 0;
        let contents = variantProducer(variant => {

        });
        return {
            size: maxSize,
            make: () => contents,
        };
    };

    let slot = () => union(variant => ({
        data: variant(struct(field => ({
            branches: field(array(pointer(slot()))),
        }))),
        free: variant(struct(field => ({
            next: field(pointer(slot())),
        }))),
        transaction: variant(struct(field => ({
            next: field(pointer(slot())),
            data: field(enum_(variant => ({
                bit0: variant(),
                bit1: variant(),
                removal: variant(),
                insertion: variant(),
            }))),
        }))),
    }));
    let staticState = struct(field => ({
        activeVariantIndex: field(bool()),
        variants: field(array(struct(field => ({
            dataTreeRoot: field(pointer(slot())),
            freesQueueBeginning: field(pointer(slot())),
            eof: field(pointer(slot())),
            transactionQueueBeginning: field(pointer(slot())),
        })))),
    })).make(0);

    return {
        get: () => {},
        beginTransaction: transactionHandler => {
            resetTransaction();
            transactionHandler({
                insert: () => {},
                remove: () => {},
            });
            commit();
        },
    };
};
