#include <stdio.h>

// Premature assumptions: int for state num, int for addresses, we can only address an int at once, client endianness will always be the same, static area will always be 256 int segments in length, file opening cannot fail
// ^^^^^ These are here to make development easier

struct db {
    FILE* _file;
    int _failure;
};

const int static_area_half = 128;

void _write_int(struct db* db, int addr, int value) {
    if (
        fseek(db->_file, addr, SEEK_SET) == -1 ||
        fwrite(&value, sizeof(value), 1, db->_file) != 1
    ) db->_failure = 1;
}

int _read_int(struct db* db, int addr) {
    int value;
    if (
        fseek(db->_file, addr, SEEK_SET) == -1 ||
        fread(&value, sizeof(value), 1, db->_file) != 1
    ) db->_failure = 1;
    return value;
}

int _get_dynamic_addr(struct db* db, int addr) {
    return static_area_half * 2 + 1 + addr;
}

int _get_activeness_bit(struct db* db) {
    return _read_int(db, 0);
}

int _get_active_addr(struct db* db, int addr) {
    return 1 + addr + static_area_half * _get_activeness_bit(db);
}

int _get_inactive_addr(struct db* db, int addr) {
    return 1 + addr + static_area_half * !_get_activeness_bit(db);
}

int _get_dyn_addr(int addr) {
    return 1 + static_area_half * 2 + addr;
}

//#define db_static_read_(addr) db_static_read(db, ((int) (size_t) &((struct dblayout*) 0)->##addr))
//#define db_static_write_(addr, value) db_static_write(db, ((int) (size_t) &((struct dblayout*) 0)->##addr), value)

void db_open(struct db* db, char* path) {
    FILE* _file = fopen(path, "w+b");
    db->_file = _file;
    db->_failure = 0;
}

void db_close(struct db* db) {
    fclose(db->_file);
}

void db_flip(struct db* db) {
    _write_int(db, 0, !_get_activeness_bit(db));
}

int db_static_read(struct db* db, int addr) {
    return _read_int(db, _get_active_addr(db, addr));
}

void db_static_write(struct db* db, int addr, int value) {
    _write_int(db, _get_inactive_addr(db, addr), value);
}

int get_failure(struct db* db) {
    return db->_failure;
}

void db_dyn_write(struct db* db, int dyn_addr_addr, int value_addr) {
    _write_int(db, _get_dyn_addr(_read_int(db, _get_active_addr(db, dyn_addr_addr))), _read_int(db, _get_active_addr(db, value_addr)));
}

void db_dyn_read(struct db* db, int dyn_addr, int local_addr) {
    _write_int(db, _get_inactive_addr(db, local_addr), _read_int(db, _get_dyn_addr(dyn_addr)));
}
