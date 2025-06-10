let makeMVPDB = bitStorage => {
    let union = variantProducer => addr => {
        let maxSize = 0;
        let contents = variantProducer(variant => {
            let { size, contents } = variant(addr);
            if (size > maxSize) {
                maxSize = size;
            }
            return contents;
        });
        return {
            size: maxSize,
            contents,
        };
    };

    let struct = fieldProducer => addr => {
        let totalSize = 0;
        let contents = fieldProducer(field => {
            let { size, contents } = field(addr + totalSize);
            totalSize += size;
            return contents;
        });
        return {
            size: totalSize,
            contents,
        };
    };

    let bool = () => addr => ({
        size: 1,
        contents: { addr },
    });

    let pointer = () => addr => ({
        size: 50,
        contents: { addr },
    });

    let array = (itemsCount, item) => addr => {
        let contents = [];
        let totalSize = 0;
        for (let i = 0; i < itemsCount; ++i) {
            let itemDescription = item(addr + totalSize);
            totalSize += itemDescription.size;
            contents.push(itemDescription.contents);
        }
        return contents;
    };

    let enum_ = variantProducer => addr => {
        let variantsCount = 0;
        let variants = variantProducer(() => {
            let oldVariantsCount = variantsCount;
            ++variantsCount;
            return oldVariantsCount;
        });
        return {
            size: Math.ceil(Math.log2(variantsCount)),
            contents: { addr, variants },
        };
    };

    let slotModel = union(variant => ({
        data: variant(struct(field => ({
            branches: field(array(2, pointer())),
        }))),
        free: variant(struct(field => ({
            next: field(pointer()),
        }))),
        transaction: variant(struct(field => ({
            next: field(pointer()),
            data: field(enum_(variant => ({
                bit0: variant(),
                bit1: variant(),
                removal: variant(),
                insertion: variant(),
            }))),
        }))),
    }));
    let staticStateModel = struct(field => ({
        activeVariantIndex: field(bool()),
        variants: field(array(2, struct(field => ({
            dataTreeRoot: field(pointer()),
            freesQueueBeginning: field(pointer()),
            eof: field(pointer()),
            transactionQueueBeginning: field(pointer()),
        })))),
    }));
    staticStateModel(0).contents // tsserver can't resolve, ugh

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
