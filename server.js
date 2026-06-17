const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const nowIso = () => new Date().toISOString();

const usuariosPersonales = [
  { id: 'PER-001', username: 'admin', password: 'admin', rol: 'ADMIN' },
];

const clientesAuth = [
  { id: 'CLI-001', usuario_cliente: 'cliente', contrasena_cliente: 'cliente', rol: 'CLIENTE' },
];

const categorias = [
  { id_categoria: 'CAT-01', nombre: 'Globos' },
  { id_categoria: 'CAT-02', nombre: 'Cotillon' },
  { id_categoria: 'CAT-03', nombre: 'Decoracion' },
];

const temporadas = [
  { id_temporada: 'TEMP-01', nombre: 'Navidad' },
  { id_temporada: 'TEMP-02', nombre: 'Carnaval' },
  { id_temporada: 'TEMP-03', nombre: 'Cumpleanos' },
];

let ubicaciones = [
  { id_ubicacion: 1, descripcion: 'Estante A1', codigo_qr: 'A1-QR' },
  { id_ubicacion: 2, descripcion: 'Estante B2', codigo_qr: 'B2-QR' },
];

const estadosProducto = [
  { id_estado_producto: 1, nombre: 'Activo' },
  { id_estado_producto: 2, nombre: 'Inactivo' },
];

const estadosProveedor = [
  { id_estado_proveedor: 1, nombre: 'Activo' },
  { id_estado_proveedor: 2, nombre: 'Inactivo' },
];

const tiposUsuario = [
  { id_tipo_usuario: 1, nombre: 'Administrador' },
  { id_tipo_usuario: 2, nombre: 'Vendedor' },
  { id_tipo_usuario: 3, nombre: 'Almacen' },
];

let productos = [
  {
    id_producto: 'PROD-001',
    nombre: 'Globo metalizado estrella',
    descripcion: 'Paquete por 10 unidades',
    precio_unidad: 12,
    precio_cantidad: 100,
    url_imagen: null,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    cantidad_stock: 85,
    categoria_id: 'CAT-01',
    temporada_id: 'TEMP-03',
    estado_producto_id: 1,
    ubicacion_id: 1,
    categoria_abc: 'A',
    categoria_abc_cantidad: 'A',
    categoria_abc_valor: 'A',
    puntos_abc_cantidad: 5,
    puntos_abc_valor: 5,
    cantidad_total_vendida: 120,
    valor_total_vendido: 1440,
    costo_de_producto: 8,
    demanda_anual: 300,
    costo_ordenar: 25,
    costo_mantenimiento: 2,
    eoq: 50,
    punto_reorden: 20,
    tiempo_entrega_dias: 3,
    stock_seguridad: 10,
    qr_producto: '',
  },
];

let clientes = [
  {
    id_cliente: 'CLI-001',
    nombre: 'Andrea',
    apellido: 'Flores',
    carnet_identidad: '1234567',
    email: 'andrea@cotillon.com',
    telefono: '70000001',
    direccion: 'Zona Central',
    estado_id: 1,
    fecha_creacion: nowIso(),
  },
];

let personal = [
  {
    id_personal: 'PER-001',
    nombre: 'Ricky',
    apellido: 'Admin',
    email: 'admin@cotillon.com',
    telefono: '70000002',
    usuario_personal: 'admin',
    tipo_usuario_id: 1,
    estado_personal_id: 1,
    activo: true,
    imagen_perfil: null,
  },
];

let proveedores = [
  {
    id_proveedor_producto: 'PROV-001',
    nombre_proveedor: 'Distribuidora Fiesta SRL',
    contacto: 'Maria',
    telefono: '70000003',
    email: 'ventas@fiesta.com',
    direccion: 'El Alto',
    notas: 'Entrega semanal',
    estado_proveedor_id: 1,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  },
];

let ventas = [];
let moldes = [];
let combos = [
  {
    id_combo: 'COMBO-001',
    nombre: 'Kit Cumpleanos 20 Personas',
    descripcion: 'Globos, velas, gorros, serpentinas y vasos tematicos.',
    precio_combo: 185,
    descuento_porcentaje: 10,
    activo: true,
    items: [
      { id_producto: 'PROD-001', cantidad: 5 },
    ],
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  },
];
let calendarioTemporadas = [
  {
    id_evento: 'TEMP-EVT-001',
    nombre: 'Campana Carnaval',
    temporada_id: 'TEMP-02',
    fecha_inicio: '2026-01-10',
    fecha_fin: '2026-02-28',
    objetivo_ventas_bs: 25000,
    presupuesto_bs: 8000,
    estado: 'planificado',
    notas: 'Promocionar combos de carnaval y mascaras.',
  },
];
let cierresCaja = [];
let cotizacionesTelegram = [];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const generateId = (prefix, collection, key) => {
  const next = collection.length + 1;
  const id = `${prefix}-${String(next).padStart(3, '0')}`;
  if (collection.some((item) => item[key] === id)) {
    return `${prefix}-${Date.now()}`;
  }
  return id;
};

const generarToken = (usuario) => {
  const base = `${usuario.username || usuario.usuario_cliente || usuario.usuario_personal}:${Date.now()}`;
  return Buffer.from(base).toString('base64');
};

const emitInventoryEvent = (channel, reason) => {
  io.emit('inventory:event', {
    channel,
    reason,
    timestamp: Date.now(),
  });
};

io.on('connection', (socket) => {
  socket.on('inventory:event:client', (event) => {
    if (!event?.channel) {
      return;
    }
    io.emit('inventory:event', {
      channel: event.channel,
      reason: event.reason || 'updated',
      timestamp: Date.now(),
    });
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cotillon-mock-api', timestamp: nowIso() });
});

app.post('/login-personal', (req, res) => {
  const { username, password } = req.body;
  const usuario = usuariosPersonales.find(
    (u) => u.username === username && u.password === password
  );

  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales de personal incorrectas' });
  }

  return res.json({
    message: 'Login de personal exitoso',
    token: generarToken(usuario),
    rol: usuario.rol,
    personal_id: usuario.id,
  });
});

app.post('/login-cliente', (req, res) => {
  const { usuario_cliente, contrasena_cliente } = req.body;
  const cliente = clientesAuth.find(
    (c) => c.usuario_cliente === usuario_cliente && c.contrasena_cliente === contrasena_cliente
  );

  if (!cliente) {
    return res.status(401).json({ error: 'Credenciales de cliente incorrectas' });
  }

  return res.json({
    message: 'Login de cliente exitoso',
    token: generarToken(cliente),
    rol: cliente.rol,
    cliente_id: cliente.id,
  });
});

app.get('/productos', (_req, res) => res.json(productos));
app.post('/productos', (req, res) => {
  const body = req.body || {};
  const nuevo = {
    id_producto: generateId('PROD', productos, 'id_producto'),
    nombre: body.nombre || 'Sin nombre',
    descripcion: body.descripcion || null,
    precio_unidad: toNumber(body.precio_unidad),
    precio_cantidad: toNumber(body.precio_cantidad),
    url_imagen: body.url_imagen || null,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    cantidad_stock: toNumber(body.cantidad_stock),
    categoria_id: body.categoria_id || categorias[0].id_categoria,
    temporada_id: body.temporada_id || null,
    estado_producto_id: toNumber(body.estado_producto_id, 1),
    ubicacion_id: toNumber(body.ubicacion_id, 1),
    categoria_abc: body.categoria_abc || 'C',
    categoria_abc_cantidad: body.categoria_abc_cantidad || 'C',
    categoria_abc_valor: body.categoria_abc_valor || 'C',
    puntos_abc_cantidad: toNumber(body.puntos_abc_cantidad, 1),
    puntos_abc_valor: toNumber(body.puntos_abc_valor, 1),
    cantidad_total_vendida: toNumber(body.cantidad_total_vendida),
    valor_total_vendido: toNumber(body.valor_total_vendido),
    costo_de_producto: toNumber(body.costo_de_producto),
    demanda_anual: body.demanda_anual == null || body.demanda_anual === '' ? null : toNumber(body.demanda_anual),
    costo_ordenar: body.costo_ordenar == null || body.costo_ordenar === '' ? null : toNumber(body.costo_ordenar),
    costo_mantenimiento: body.costo_mantenimiento == null || body.costo_mantenimiento === '' ? null : toNumber(body.costo_mantenimiento),
    eoq: body.eoq == null || body.eoq === '' ? null : toNumber(body.eoq),
    punto_reorden: body.punto_reorden == null || body.punto_reorden === '' ? null : toNumber(body.punto_reorden),
    tiempo_entrega_dias: body.tiempo_entrega_dias == null || body.tiempo_entrega_dias === '' ? null : toNumber(body.tiempo_entrega_dias),
    stock_seguridad: body.stock_seguridad == null || body.stock_seguridad === '' ? null : toNumber(body.stock_seguridad),
    qr_producto: body.qr_producto || '',
  };

  productos.push(nuevo);
  emitInventoryEvent('productos', 'created');
  res.status(201).json(nuevo);
});
app.put('/productos/:id', (req, res) => {
  const idx = productos.findIndex((p) => p.id_producto === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  productos[idx] = { ...productos[idx], ...req.body, fecha_actualizacion: nowIso() };
  emitInventoryEvent('productos', 'updated');
  return res.json(productos[idx]);
});
app.delete('/productos/:id', (req, res) => {
  const before = productos.length;
  productos = productos.filter((p) => p.id_producto !== req.params.id);
  if (before === productos.length) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  emitInventoryEvent('productos', 'deleted');
  return res.status(204).send();
});
app.put('/productos/:id/estado', (req, res) => {
  const producto = productos.find((p) => p.id_producto === req.params.id);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  producto.estado_producto_id = toNumber(req.body?.estado_producto_id, 1);
  producto.fecha_actualizacion = nowIso();
  emitInventoryEvent('productos', 'status-updated');
  return res.json(producto);
});

app.get('/clientes', (_req, res) => res.json(clientes));
app.get('/clientes/nombres', (_req, res) => res.json(clientes.map((c) => ({ id_cliente: c.id_cliente, nombre: c.nombre, apellido: c.apellido }))));
app.get('/clientes/:id', (req, res) => {
  const item = clientes.find((c) => String(c.id_cliente) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  return res.json(item);
});
app.get('/clientes/buscar-por-carnet/:carnet', (req, res) => {
  const item = clientes.find((c) => String(c.carnet_identidad) === String(req.params.carnet));
  if (!item) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  return res.json(item);
});
app.post('/clientes', (req, res) => {
  const nuevo = {
    id_cliente: generateId('CLI', clientes, 'id_cliente'),
    estado_id: 1,
    fecha_creacion: nowIso(),
    ...req.body,
  };
  clientes.push(nuevo);
  emitInventoryEvent('clientes', 'created');
  res.status(201).json(nuevo);
});
app.put('/clientes/:id', (req, res) => {
  const idx = clientes.findIndex((c) => String(c.id_cliente) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  clientes[idx] = { ...clientes[idx], ...req.body };
  emitInventoryEvent('clientes', 'updated');
  return res.json(clientes[idx]);
});
app.put('/clientes/:id/estado', (req, res) => {
  const item = clientes.find((c) => String(c.id_cliente) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  item.estado_id = toNumber(req.body?.estado_id, 1);
  emitInventoryEvent('clientes', 'status-updated');
  return res.json(item);
});
app.delete('/clientes/:id', (req, res) => {
  const before = clientes.length;
  clientes = clientes.filter((c) => String(c.id_cliente) !== String(req.params.id));
  if (before === clientes.length) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  emitInventoryEvent('clientes', 'deleted');
  return res.status(204).send();
});

app.get('/personal', (_req, res) => res.json(personal));
app.get('/personal/nombres', (_req, res) => res.json(personal.map((p) => ({ id_personal: p.id_personal, nombre_personal: `${p.nombre || ''} ${p.apellido || ''}`.trim() }))));
app.post('/personal', (req, res) => {
  const nuevo = {
    id_personal: generateId('PER', personal, 'id_personal'),
    estado_personal_id: 1,
    activo: true,
    ...req.body,
  };
  personal.push(nuevo);
  emitInventoryEvent('personal', 'created');
  res.status(201).json(nuevo);
});
app.put('/personal/:id', (req, res) => {
  const idx = personal.findIndex((p) => String(p.id_personal) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Personal no encontrado' });
  }
  personal[idx] = { ...personal[idx], ...req.body };
  emitInventoryEvent('personal', 'updated');
  return res.json(personal[idx]);
});
app.delete('/personal/:id', (req, res) => {
  const before = personal.length;
  personal = personal.filter((p) => String(p.id_personal) !== String(req.params.id));
  if (before === personal.length) {
    return res.status(404).json({ error: 'Personal no encontrado' });
  }
  emitInventoryEvent('personal', 'deleted');
  return res.status(204).send();
});

app.get('/ventas', (_req, res) => res.json(ventas));
app.post('/ventas', (req, res) => {
  const venta = {
    id_venta: generateId('VEN', ventas, 'id_venta'),
    fecha_venta: req.body?.fecha_venta || nowIso(),
    cliente_id: req.body?.cliente_id,
    personal_id: req.body?.personal_id,
    total: toNumber(req.body?.total),
    notas: req.body?.notas || null,
    productos_vendidos: Array.isArray(req.body?.productos_vendidos) ? req.body.productos_vendidos : [],
  };

  venta.productos_vendidos.forEach((line) => {
    const prod = productos.find((p) => String(p.id_producto) === String(line.id_producto));
    if (prod) {
      prod.cantidad_stock = Math.max(0, toNumber(prod.cantidad_stock) - toNumber(line.cantidad, 0));
      prod.cantidad_total_vendida = toNumber(prod.cantidad_total_vendida) + toNumber(line.cantidad, 0);
      prod.valor_total_vendido = toNumber(prod.valor_total_vendido) + toNumber(line.subtotal, 0);
      prod.fecha_actualizacion = nowIso();
    }
  });

  ventas.push(venta);
  emitInventoryEvent('ventas', 'created');
  emitInventoryEvent('productos', 'stock-updated');
  res.status(201).json(venta);
});
app.put('/ventas/:id', (req, res) => {
  const idx = ventas.findIndex((v) => String(v.id_venta) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }
  ventas[idx] = { ...ventas[idx], ...req.body };
  emitInventoryEvent('ventas', 'updated');
  return res.json(ventas[idx]);
});
app.delete('/ventas/:id', (req, res) => {
  const idx = ventas.findIndex((v) => String(v.id_venta) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  const venta = ventas[idx];
  (venta.productos_vendidos || []).forEach((line) => {
    const prod = productos.find((p) => String(p.id_producto) === String(line.id_producto));
    if (prod) {
      prod.cantidad_stock = toNumber(prod.cantidad_stock) + toNumber(line.cantidad, 0);
      prod.fecha_actualizacion = nowIso();
    }
  });

  ventas.splice(idx, 1);
  emitInventoryEvent('ventas', 'deleted');
  emitInventoryEvent('productos', 'stock-restored');
  return res.status(204).send();
});

app.get('/proveedores-producto', (_req, res) => res.json(proveedores));
app.post('/proveedores-producto', (req, res) => {
  const nuevo = {
    id_proveedor_producto: generateId('PROV', proveedores, 'id_proveedor_producto'),
    estado_proveedor_id: 1,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    ...req.body,
  };
  proveedores.push(nuevo);
  emitInventoryEvent('proveedores', 'created');
  res.status(201).json(nuevo);
});
app.put('/proveedores-producto/:id', (req, res) => {
  const idx = proveedores.findIndex((p) => String(p.id_proveedor_producto) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  proveedores[idx] = { ...proveedores[idx], ...req.body, fecha_actualizacion: nowIso() };
  emitInventoryEvent('proveedores', 'updated');
  return res.json(proveedores[idx]);
});
app.put('/proveedores-producto/:id/estado', (req, res) => {
  const item = proveedores.find((p) => String(p.id_proveedor_producto) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  item.estado_proveedor_id = toNumber(req.body?.estado_proveedor_id, 1);
  item.fecha_actualizacion = nowIso();
  emitInventoryEvent('proveedores', 'status-updated');
  return res.json(item);
});
app.delete('/proveedores-producto/:id', (req, res) => {
  const before = proveedores.length;
  proveedores = proveedores.filter((p) => String(p.id_proveedor_producto) !== String(req.params.id));
  if (before === proveedores.length) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  emitInventoryEvent('proveedores', 'deleted');
  return res.status(204).send();
});

app.get('/moldes', (_req, res) => res.json(moldes));
app.post('/moldes', (req, res) => {
  const nuevo = {
    id_molde: generateId('MOL', moldes, 'id_molde'),
    ...req.body,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  };
  moldes.push(nuevo);
  return res.status(201).json(nuevo);
});
app.put('/moldes/:id', (req, res) => {
  const idx = moldes.findIndex((m) => String(m.id_molde) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Molde no encontrado' });
  }
  moldes[idx] = { ...moldes[idx], ...req.body, fecha_actualizacion: nowIso() };
  return res.json(moldes[idx]);
});
app.delete('/moldes/:id', (req, res) => {
  const before = moldes.length;
  moldes = moldes.filter((m) => String(m.id_molde) !== String(req.params.id));
  if (before === moldes.length) {
    return res.status(404).json({ error: 'Molde no encontrado' });
  }
  return res.status(204).send();
});
app.post('/moldes/analyze-image', (_req, res) => {
  return res.json({
    success: true,
    parts: [],
    grayscalePreview: null,
    transparentPreview: null,
  });
});

app.get('/pedidos', (_req, res) => res.json([]));
app.get('/Pedidos', (_req, res) => res.json([]));

app.get('/combos', (_req, res) => res.json(combos));
app.post('/combos', (req, res) => {
  const body = req.body || {};
  const nuevo = {
    id_combo: generateId('COMBO', combos, 'id_combo'),
    nombre: body.nombre || 'Nuevo combo',
    descripcion: body.descripcion || null,
    precio_combo: toNumber(body.precio_combo, 0),
    descuento_porcentaje: toNumber(body.descuento_porcentaje, 0),
    activo: body.activo !== false,
    items: Array.isArray(body.items) ? body.items : [],
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  };
  combos.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/combos/:id', (req, res) => {
  const idx = combos.findIndex((c) => String(c.id_combo) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Combo no encontrado' });
  }
  combos[idx] = { ...combos[idx], ...req.body, fecha_actualizacion: nowIso() };
  return res.json(combos[idx]);
});
app.delete('/combos/:id', (req, res) => {
  const before = combos.length;
  combos = combos.filter((c) => String(c.id_combo) !== String(req.params.id));
  if (before === combos.length) {
    return res.status(404).json({ error: 'Combo no encontrado' });
  }
  return res.status(204).send();
});

app.get('/calendario-temporadas', (_req, res) => res.json(calendarioTemporadas));
app.post('/calendario-temporadas', (req, res) => {
  const body = req.body || {};
  const nuevo = {
    id_evento: generateId('TEMP-EVT', calendarioTemporadas, 'id_evento'),
    nombre: body.nombre || 'Nueva campana',
    temporada_id: body.temporada_id || null,
    fecha_inicio: body.fecha_inicio || null,
    fecha_fin: body.fecha_fin || null,
    objetivo_ventas_bs: toNumber(body.objetivo_ventas_bs, 0),
    presupuesto_bs: toNumber(body.presupuesto_bs, 0),
    estado: body.estado || 'planificado',
    notas: body.notas || null,
  };
  calendarioTemporadas.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/calendario-temporadas/:id', (req, res) => {
  const idx = calendarioTemporadas.findIndex((e) => String(e.id_evento) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  calendarioTemporadas[idx] = { ...calendarioTemporadas[idx], ...req.body };
  return res.json(calendarioTemporadas[idx]);
});
app.delete('/calendario-temporadas/:id', (req, res) => {
  const before = calendarioTemporadas.length;
  calendarioTemporadas = calendarioTemporadas.filter((e) => String(e.id_evento) !== String(req.params.id));
  if (before === calendarioTemporadas.length) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  return res.status(204).send();
});

app.get('/cierres-caja', (_req, res) => res.json(cierresCaja));
app.post('/cierres-caja', (req, res) => {
  const body = req.body || {};
  const fecha = body.fecha || nowIso().slice(0, 10);
  const ventasDia = ventas.filter((v) => String(v.fecha_venta || '').slice(0, 10) === fecha);
  const totalVentas = ventasDia.reduce((sum, v) => sum + toNumber(v.total, 0), 0);
  const efectivo = toNumber(body.efectivo_bs, 0);
  const qr = toNumber(body.qr_bs, 0);
  const transferencia = toNumber(body.transferencia_bs, 0);
  const totalCaja = efectivo + qr + transferencia;
  const diferencia = totalCaja - totalVentas;

  const cierre = {
    id_cierre: generateId('CIERRE', cierresCaja, 'id_cierre'),
    fecha,
    responsable: body.responsable || 'Sin responsable',
    efectivo_bs: efectivo,
    qr_bs: qr,
    transferencia_bs: transferencia,
    total_ventas_bs: totalVentas,
    total_caja_bs: totalCaja,
    diferencia_bs: diferencia,
    observaciones: body.observaciones || null,
    creado_en: nowIso(),
  };

  cierresCaja.push(cierre);
  return res.status(201).json(cierre);
});

app.get('/cotizaciones-telegram', (_req, res) => res.json(cotizacionesTelegram));
app.post('/cotizaciones-telegram', (req, res) => {
  const body = req.body || {};
  const nueva = {
    id_cotizacion: generateId('COTI', cotizacionesTelegram, 'id_cotizacion'),
    nombre_cliente: body.nombre_cliente || 'Cliente sin nombre',
    telefono_telegram: body.telefono_telegram || '',
    evento: body.evento || 'General',
    fecha_evento: body.fecha_evento || null,
    detalle: body.detalle || null,
    monto_estimado_bs: toNumber(body.monto_estimado_bs, 0),
    estado: body.estado || 'pendiente',
    creado_en: nowIso(),
    actualizado_en: nowIso(),
  };
  cotizacionesTelegram.push(nueva);
  return res.status(201).json(nueva);
});
app.put('/cotizaciones-telegram/:id', (req, res) => {
  const idx = cotizacionesTelegram.findIndex((c) => String(c.id_cotizacion) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Cotizacion no encontrada' });
  }
  cotizacionesTelegram[idx] = { ...cotizacionesTelegram[idx], ...req.body, actualizado_en: nowIso() };
  return res.json(cotizacionesTelegram[idx]);
});

app.get('/categorias', (_req, res) => res.json(categorias));
app.get('/temporadas', (_req, res) => res.json(temporadas));
app.get('/ubicaciones', (_req, res) => res.json(ubicaciones));
app.post('/ubicaciones', (req, res) => {
  const nuevo = {
    id_ubicacion: ubicaciones.length ? Math.max(...ubicaciones.map((u) => Number(u.id_ubicacion) || 0)) + 1 : 1,
    descripcion: req.body?.descripcion || 'Nueva ubicacion',
    codigo_qr: req.body?.codigo_qr || '',
  };
  ubicaciones.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/ubicaciones/:id', (req, res) => {
  const idx = ubicaciones.findIndex((u) => String(u.id_ubicacion) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Ubicacion no encontrada' });
  }
  ubicaciones[idx] = { ...ubicaciones[idx], ...req.body };
  res.json(ubicaciones[idx]);
});
app.delete('/ubicaciones/:id', (req, res) => {
  const before = ubicaciones.length;
  ubicaciones = ubicaciones.filter((u) => String(u.id_ubicacion) !== String(req.params.id));
  if (before === ubicaciones.length) {
    return res.status(404).json({ error: 'Ubicacion no encontrada' });
  }
  res.status(204).send();
});
app.get('/estados-producto', (_req, res) => res.json(estadosProducto));
app.get('/estados-proveedor', (_req, res) => res.json(estadosProveedor));
app.get('/tipos-usuario', (_req, res) => res.json(tiposUsuario));

app.get('/exportar-productos', (_req, res) => res.json(productos));
app.get('/exportar-clientes', (_req, res) => res.json(clientes));
app.get('/exportar-resenas', (_req, res) => res.json([]));
app.get('/exportar-personal-entrega', (_req, res) => res.json(personal));

app.post('/upload-imagen', (_req, res) => res.json({ imageUrl: '/assets/images.png' }));
app.post('/upload-imagen-personal', (_req, res) => res.json({ imageUrl: '/assets/user.png' }));

app.put('/abc-con-valor-monetario', (_req, res) => {
  productos = productos.map((p) => {
    const valorTotal = toNumber(p.valor_total_vendido, 0);
    let categoriaABC = 'C';
    if (valorTotal >= 1000) {
      categoriaABC = 'A';
    } else if (valorTotal >= 300) {
      categoriaABC = 'B';
    }

    return {
      ...p,
      categoria_abc_valor: categoriaABC,
      categoria_abc_cantidad: p.cantidad_total_vendida >= 100 ? 'A' : p.cantidad_total_vendida >= 40 ? 'B' : 'C',
      fecha_actualizacion: nowIso(),
    };
  });

  emitInventoryEvent('productos', 'abc-updated');
  res.json({ message: 'Analisis ABC recalculado (mock)' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock API server listening at http://localhost:${PORT}`);
});
