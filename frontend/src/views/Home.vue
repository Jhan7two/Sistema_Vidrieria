<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-rose-600 to-rose-700 text-white py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">Sistema Vidriería Montero</h1>
          <p class="text-xl mb-8">Administre su inventario, clientes y ventas de manera eficiente</p>
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <router-link to="/auth/login" class="bg-white text-blue-700 hover:bg-rose-100 font-semibold py-3 px-6 rounded-lg transition duration-300">
              Iniciar Sesión
            </router-link>
            <router-link to="/controlPanel" class="bg-transparent hover:bg-blue-700 border border-white font-semibold py-3 px-6 rounded-lg transition duration-300">
              Panel de Control
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Características Principales</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Gestión de Inventario</h3>
            <p class="text-gray-600">Control completo de su inventario de vidrios, aluminio y accesorios con alertas de stock mínimo.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Administración de Clientes</h3>
            <p class="text-gray-600">Mantenga un registro detallado de sus clientes y su historial de compras para mejorar su servicio.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Facturación y Ventas</h3>
            <p class="text-gray-600">Genere facturas, presupuestos y gestione sus ventas de manera rápida y eficiente.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; {{ new Date().getFullYear() }} Sistema de Vidriería. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'Home',
  metaInfo: {
    title: 'Inicio - Sistema de Vidriería'
  }
}
</script>
