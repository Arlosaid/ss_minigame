# Guía de Despliegue en GitHub Pages

## Configuración Completada

Tu proyecto ya está configurado para desplegarse en GitHub Pages. Los cambios realizados incluyen:

1. **vite.config.ts**: Configurado con `base: '/ss_minigame/'`
2. **package.json**: Agregado homepage y scripts de deploy
3. **Rutas de assets**: Todas las rutas ahora usan `import.meta.env.BASE_URL`
4. **gh-pages instalado**: Paquete para despliegue automático

---

## Desplegar a GitHub Pages

### Opción 1: Despliegue Automático (Recomendado)

```bash
npm run deploy
```

Este comando:
1. Construye el proyecto (`npm run build`)
2. Despliega la carpeta `dist` a la rama `gh-pages`
3. GitHub Pages automáticamente sirve el contenido

### Opción 2: Despliegue Manual

```bash
# 1. Construir el proyecto
npm run build

# 2. Desplegar manualmente
npx gh-pages -d dist
```

---

## Configurar GitHub Pages (Primera vez)

1. **Sube tus cambios a GitHub**:
   ```bash
   git add .
   git commit -m "Configurar proyecto para GitHub Pages"
   git push origin main
   ```

2. **Ejecuta el deploy**:
   ```bash
   npm run deploy
   ```

3. **Habilita GitHub Pages**:
   - Ve a tu repositorio en GitHub
   - Settings > Pages
   - En "Source", selecciona: **Branch: gh-pages** > **/ (root)**
   - Click en "Save"

4. **Accede a tu juego**:
   - URL: https://arlosaid.github.io/ss_minigame
   - Puede tardar 1-2 minutos en estar disponible

---

## Verificar el Despliegue

### Verificar que la rama gh-pages existe:
```bash
git branch -a
```

Deberías ver `remotes/origin/gh-pages` en la lista.

### Verificar en GitHub:
1. Ve a tu repositorio
2. Click en el botón de ramas (branch selector)
3. Deberías ver la rama `gh-pages`

---

## Solución de Problemas

### Problema: "Page Not Found" o página en blanco

**Causa**: La configuración base no coincide con el nombre del repositorio.

**Solución**: Verifica que en `vite.config.ts`:
```typescript
base: '/ss_minigame/'  // Debe coincidir con el nombre de tu repo
```

### Problema: Los sprites no se cargan

**Causa**: Rutas incorrectas o carpeta `public/assets` no existe.

**Solución**: 
1. Verifica que los assets estén en `public/assets/`
   - `public/assets/sprites/` para sprites
   - `public/assets/images/` para imágenes
   - `public/assets/audio/` para música
2. Todas las rutas ahora usan `import.meta.env.BASE_URL`
3. Consulta `public/assets/README.md` para la estructura completa

### Problema: Error al ejecutar npm run deploy

**Causa**: No hay permisos o no estás autenticado en GitHub.

**Solución**:
```bash
# Verifica tu autenticación
git config user.name
git config user.email

# Asegúrate de estar en la rama correcta
git branch
```

### Problema: Los cambios no se reflejan

**Solución**:
1. Limpia el caché del navegador (Ctrl + Shift + R)
2. Espera 1-2 minutos después del deploy
3. Verifica que el commit esté en la rama `gh-pages`:
   ```bash
   git log remotes/origin/gh-pages
   ```

---

## Actualizar el Juego

Cada vez que hagas cambios:

```bash
# 1. Guarda tus cambios
git add .
git commit -m "Descripción de los cambios"
git push

# 2. Despliega la nueva versión
npm run deploy
```

---

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Construir para producción
npm run build

# Preview del build local
npm run preview

# Desplegar a GitHub Pages
npm run deploy
```

---

## URL Final

Tu juego estará disponible en:
**https://arlosaid.github.io/ss_minigame**

---

## Notas Importantes

1. **Carpeta public/**: Todo lo que esté aquí se copia tal cual al build
2. **BASE_URL**: Vite automáticamente resuelve las rutas según el entorno
3. **Rama gh-pages**: No edites esta rama manualmente, se genera automáticamente
4. **Cache**: GitHub Pages puede cachear contenido, usa Ctrl+Shift+R para recargar

---

## Checklist de Despliegue

- [ ] `npm run build` funciona sin errores
- [ ] Los assets están en `public/assets/`
- [ ] `vite.config.ts` tiene el `base` correcto
- [ ] `package.json` tiene el `homepage` correcto
- [ ] Ejecutaste `npm run deploy`
- [ ] Configuraste GitHub Pages en Settings
- [ ] La página carga en https://arlosaid.github.io/ss_minigame

---

Listo! Tu juego de Saint Seiya debería estar funcionando en GitHub Pages.
