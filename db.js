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
    let readNumber = (size, addr) => makeNumber(readSequence(size, addr));
    let writeNumber = (number, size, addr) => writeSequence(makeSequence(number, size), addr)

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
        let read = () => readNumber(size, addr);
        return {
            size,
            read,
            write: newValue => writeNumber(newValue, size, addr),
            get: index => target(read() + index * target(0).size).contents,
        };
    };
    let array = (itemsCount, item) => addr => {
        let itemSize = item(0).size;
        return {
            size: itemSize * itemsCount,
            contents: {
                get: index => {
                    if (index < itemsCount) {
                        return item(addr + index * itemSize).contents;
                    }
                    throw new Error("Array index out of bounds");
                },
            },
        };
    };
    let enum_ = variantProducer => addr => {
        let variantsCount = 0;
        let variants = variantProducer(() => {
            let oldVariantsCount = variantsCount;
            ++variantsCount;
            return oldVariantsCount;
        });
        let size = Math.ceil(Math.log2(variantsCount));
        return {
            size,
            contents: { 
                read: () => readNumber(size, addr),
                write: newValue => writeNumber(newValue, size, addr),
                variants,
            },
        };
    };
    let protect = item => addr => {
        let combination = struct(field => ({
            activeVariantIndex: field(bool()),
            variants: field(array(item)),
        }))(addr);
        return {
            size: combination.size,
            contents: {
                switch_: () => {
                    combination.contents.activeVariantIndex.write(combination.contents.activeVariantIndex.read());
                },
                getActiveVariant: () => combination.contents.variants.get(combination.contents.activeVariantIndex.read()),
                getInactiveVariant: () => combination.contents.variants.get(1 - combination.contents.activeVariantIndex.read()),
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
    let staticState = () => protect(struct(field => ({
        dataTreeRoot: field(pointer(slot())),
        freesQueueBeginning: field(pointer(slot())),
        eof: field(pointer(slot())),
        transactionQueueBeginning: field(pointer(slot())),
    })));

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
