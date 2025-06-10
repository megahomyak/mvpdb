let makeMVPDB = bitStorage => {
    let readSequence = (size, addr) => Array.from({ length: size }).map((_, i) => bitStorage.read(addr + i));
    let writeSequence = (sequence, addr) => sequence.forEach((bit, i) => bitStorage.write(bit, addr + i));
    let makeSequence = (number, size) => {
        let sequence = Array.from(number.toString(2).padStart(size, '0'), bit => bit == '1');
        if (sequence.length > size) {
            throw new Error("Number too big");
        }
        return sequence;
    };
    let makeNumber = sequence => parseInt(sequence.join(""), 2);

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
        contents: {
            read: () => bitStorage.read(addr),
            write: newValue => bitStorage.write(newValue, addr),
        },
    });
    let pointer = target => addr => {
        const size = 50;
        let read = () => readSequence(size, addr);
        return {
            size,
            read,
            write: newValue => writeSequence(makeSequence(newValue, size), addr),
            resolve: () => target(read()),
        };
    };
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
        const size = Math.ceil(Math.log2(variantsCount));
        return {
            size,
            contents: { 
                read: () => makeNumber(readSequence(size, addr)),
                write: newValue => writeSequence(makeSequence(newValue, size), addr),
                variants,
            },
        };
    };

    let slot = () => union(variant => ({
        data: variant(struct(field => ({
            branches: field(array(2, pointer(slot()))),
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
    let staticState = () => struct(field => ({
        activeVariantIndex: field(bool()),
        variants: field(array(2, struct(field => ({
            dataTreeRoot: field(pointer(slot())),
            freesQueueBeginning: field(pointer(slot())),
            eof: field(pointer(slot())),
            transactionQueueBeginning: field(pointer(slot())),
        })))),
    }));

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
