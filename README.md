# Serie Histórica FRES

[Abrir los gráficos](https://nachorock73.github.io/Serie-Historica-FRES/)

Visualización interactiva de las series de siete estaciones: A00, A01, A02, A04, A05, J04 y P01. La portada muestra el intervalo de fechas, las variables con datos y el número de registros de cada estación. Los gráficos permiten consultar valores, ampliar períodos y seleccionar fechas.

## Actualizar los datos

1. Genera los CSV consolidados con el notebook de consolidación del proyecto.
2. En GitHub, abre la carpeta [`merged`](merged), elige **Add file → Upload files** y sube los CSV actualizados con sus mismos nombres. Puedes actualizar una o varias estaciones a la vez; conserva los archivos de las demás.
3. Guarda los cambios con **Commit changes** en la rama `main`. Si se crea una propuesta de cambios, debe incorporarse a `main` para publicar.
4. Revisa la pestaña [Actions](https://github.com/Nachorock73/Serie-Historica-FRES/actions/workflows/pages.yml). Cuando **Publicar series FRES** termine correctamente, recarga la página de los gráficos.

**La publicación es automática después de guardar los cambios en `main`. No hace falta editar los HTML ni ejecutar otro programa.** Cambiar archivos solo en Google Drive o en el equipo no actualiza GitHub: hay que subir los CSV al repositorio.

El proceso comprueba los CSV, recalcula las tarjetas y publica la web en GitHub Pages. Cada gráfico lee el CSV de su estación desde esa publicación. La portada se genera durante el despliegue para evitar descargar los siete CSV al entrar.

Una pestaña que ya estaba abierta conserva los datos cargados: recárgala después de que termine la publicación. Si aparece información anterior, prueba una recarga completa con `Ctrl+F5` o `Cmd+Shift+R`.

## Archivos que debes subir

Dentro de `merged`, mantener estos nombres exactos:

| Estación | Archivo |
|---|---|
| A00 | `A00_merged.csv` |
| A01 | `A01_merged.csv` |
| A02 | `A02_merged.csv` |
| A04 | `A04_merged.csv` |
| A05 | `A05_merged.csv` |
| J04 | `J04_merged.csv` |
| P01 | `P01_merged.csv` |

Este repositorio publica los datos ya consolidados. La unión de campañas, las correcciones y la validación científica se realizan antes, en el proyecto de estaciones. Los XLSX, las descargas originales y el notebook no son necesarios aquí.

## Formato de los CSV

Usar CSV con codificación UTF-8, coma como separador y punto decimal. La primera columna debe llamarse `Date`; las restantes contienen mediciones numéricas. Las fechas deben ser únicas y estar ordenadas de la más antigua a la más reciente, con formato `AAAA-MM-DD HH:MM:SS`. También se admiten `T` entre fecha y hora y fracciones de segundo. Mantener la misma hora de referencia y las mismas unidades entre campañas.

```csv
Date,DO,Temp_DO,pCO2
2026-01-01 00:00:00,7.1,8.2,350
2026-01-01 00:15:00,,8.3,355
```

Dejar las mediciones ausentes vacías; también se reconocen `NA`, `NaN` y `null`. El cero es un valor válido. Los espacios sin observaciones permanecen visibles en los gráficos; la web no interpola ni corrige datos.

Cada archivo debe contener al menos una observación numérica. Las variables completamente vacías no se grafican ni se cuentan como disponibles. **Registros** significa filas del CSV, incluidos los intervalos que no tienen mediciones; no es el número de celdas válidas.

Agregar una estación nueva requiere añadir su página y actualizar la configuración del visor y del despliegue. Para actualizar las siete estaciones actuales, basta con reemplazar sus CSV.

## Si una actualización falla

Abre la ejecución que falló en **Actions** y consulta el paso marcado como error. La validación identifica problemas como archivos ausentes, fechas duplicadas o desordenadas, columnas desplazadas y valores que no son numéricos. Corrige el CSV y vuelve a guardarlo en `main`; se iniciará otra publicación.

Si falla la validación, GitHub Pages conserva la última versión publicada correctamente. Que un archivo nuevo aparezca en el repositorio no significa que ya esté publicado: comprueba el resultado de **Publicar series FRES**.

La configuración del repositorio debe mantener **Settings → Pages → Source: GitHub Actions**, con las acciones habilitadas. El proceso está definido en [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Contenido del repositorio

- `index.html`: selección de estaciones y tarjetas de resumen.
- `A00.html`, `A01.html`, etc.: páginas de las estaciones.
- `merged/`: CSV que alimentan los gráficos.
- `assets/`: Plotly, estilos y lector compartido de CSV.
- `.github/workflows/pages.yml`: validación y publicación automática.

Los gráficos usan una sola copia compartida de Plotly y descargan únicamente el CSV de la estación seleccionada. Puedes descargar ese mismo CSV desde la página de cada estación.
