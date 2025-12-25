#include <stdio.h>

typedef struct {

} data_a;

typedef struct {

} data_b;

typedef enum {
    state_a,
    state_b,
    none,
} states;

typedef struct {
    FILE* file;
} ctx;

#define load_data(state_name, data_var_name) data_##state_name data_var_name; fread(&data_var_name, sizeof(data_var_name), 1, c->file);

states process_a(ctx *c) {
    load_data(a, data);
    return state_b;
}

int main(void) {

}
