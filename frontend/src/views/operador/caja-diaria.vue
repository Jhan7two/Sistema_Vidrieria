<template>
  <div class="caja-diaria">
    <h2>Caja Diaria</h2>
    <div class="saldo-actual">
      <strong>Saldo actual:</strong> {{ saldo | currency }}
    </div>
    <div class="acciones">
      <div class="form-ingreso">
        <h3>Registrar Ingreso</h3>
        <form @submit.prevent="registrarMovimiento('entrada')">
          <input v-model="nuevoIngreso.concepto" placeholder="Concepto" required />
          <input v-model.number="nuevoIngreso.monto" type="number" min="0" step="0.01" placeholder="Monto" required />
          <input v-model="nuevoIngreso.descripcion" placeholder="Descripción" />
          <button type="submit">Registrar Ingreso</button>
        </form>
      </div>
      <div class="form-egreso">
        <h3>Registrar Egreso</h3>
        <form @submit.prevent="registrarMovimiento('salida')">
          <input v-model="nuevoEgreso.concepto" placeholder="Concepto" required />
          <input v-model.number="nuevoEgreso.monto" type="number" min="0" step="0.01" placeholder="Monto" required />
          <input v-model="nuevoEgreso.descripcion" placeholder="Descripción" />
          <button type="submit">Registrar Egreso</button>
        </form>
      </div>
    </div>
    <div class="historial">
      <h3>Movimientos del Día</h3>
      <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in movimientos" :key="mov.id">
            <td>{{ mov.hora }}</td>
            <td :class="mov.tipo === 'entrada' ? 'entrada' : 'salida'">{{ mov.tipo }}</td>
            <td>{{ mov.concepto }}</td>
            <td>{{ mov.monto | currency }}</td>
            <td>{{ mov.descripcion }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="cierre-dia">
      <button @click="cerrarDia" :disabled="cerrado">Cerrar Día</button>
      <span v-if="cerrado" class="cerrado-msg">Día cerrado</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CajaDiaria',
  data() {
    return {
      saldo: 0,
      movimientos: [],
      nuevoIngreso: {
        concepto: '',
        monto: null,
        descripcion: ''
      },
      nuevoEgreso: {
        concepto: '',
        monto: null,
        descripcion: ''
      },
      cerrado: false
    }
  },
  methods: {
    registrarMovimiento(tipo) {
      let movimiento = {};
      if (tipo === 'entrada') {
        movimiento = {
          id: Date.now(),
          hora: new Date().toLocaleTimeString(),
          tipo: 'entrada',
          concepto: this.nuevoIngreso.concepto,
          monto: this.nuevoIngreso.monto,
          descripcion: this.nuevoIngreso.descripcion
        };
        this.saldo += this.nuevoIngreso.monto;
        this.nuevoIngreso = { concepto: '', monto: null, descripcion: '' };
      } else {
        movimiento = {
          id: Date.now(),
          hora: new Date().toLocaleTimeString(),
          tipo: 'salida',
          concepto: this.nuevoEgreso.concepto,
          monto: this.nuevoEgreso.monto,
          descripcion: this.nuevoEgreso.descripcion
        };
        this.saldo -= this.nuevoEgreso.monto;
        this.nuevoEgreso = { concepto: '', monto: null, descripcion: '' };
      }
      this.movimientos.push(movimiento);
    },
    cerrarDia() {
      this.cerrado = true;
    }
  },
  filters: {
    currency(value) {
      if (typeof value !== 'number') {
        return value;
      }
      return '$' + value.toFixed(2);
    }
  }
}
</script>

<style scoped>
.caja-diaria {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.saldo-actual {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}
.acciones {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}
.form-ingreso, .form-egreso {
  flex: 1;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 6px;
}
.form-ingreso h3, .form-egreso h3 {
  margin-top: 0;
}
.historial {
  margin-bottom: 2rem;
}
.historial table {
  width: 100%;
  border-collapse: collapse;
}
.historial th, .historial td {
  border: 1px solid #e0e0e0;
  padding: 0.5rem;
  text-align: left;
}
.entrada {
  color: green;
}
.salida {
  color: red;
}
.cierre-dia {
  text-align: right;
}
.cerrado-msg {
  color: #888;
  margin-left: 1rem;
}
</style>