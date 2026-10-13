'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { WorkerSchema } from '../types'

export async function getWorkers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching workers:', error)
    return []
  }

  return data
}

export async function createWorker(formData: FormData) {
  try {
    const supabase = await createClient()
    
    const workerData = WorkerSchema.parse({
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      document_number: formData.get('document_number'),
      job_title: formData.get('job_title'),
      hire_date: formData.get('hire_date'),
      is_active: true,
    })

    const { data, error } = await supabase
      .from('workers')
      .insert([workerData])
      .select()

    if (error) throw error

    revalidatePath('/workers')
    return { success: true, data }
  } catch (error: any) {
    console.error('Error creating worker:', error)
    return { success: false, error: error.message || 'Error de validación o base de datos' }
  }
}

export async function toggleWorkerStatus(id: string, isActive: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('workers')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error updating worker status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/workers')
  return { success: true }
}

export async function updateWorker(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    
    const workerData = WorkerSchema.parse({
      id,
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      document_number: formData.get('document_number'),
      job_title: formData.get('job_title'),
      hire_date: formData.get('hire_date'),
    })
    
    const { id: _, ...updateData } = workerData

    const { data, error } = await supabase
      .from('workers')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    revalidatePath('/workers')
    return { success: true, data }
  } catch (error: any) {
    console.error('Error updating worker:', error)
    return { success: false, error: error.message || 'Error de validación' }
  }
}

export async function deleteWorker(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('workers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting worker:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/workers')
  return { success: true }
}

export async function importWorkers(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No se encontró archivo' };

    const buffer = await file.arrayBuffer();
    // Using dynamic import so xlsx is only loaded when needed
    const xlsx = await import('xlsx');
    const wb = xlsx.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);

    const supabase = await createClient();

    const workersData = data.map((row: any) => {
      // Excel serial date to JS Date
      // Excel epoch starts at 1899-12-30
      let hire_date = new Date().toISOString().split('T')[0];
      if (row['FECHA DE INGRESO']) {
        const serial = row['FECHA DE INGRESO'];
        if (typeof serial === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + serial * 86400000);
          hire_date = date.toISOString().split('T')[0];
        } else if (typeof serial === 'string') {
          // just in case it's string format
          hire_date = serial;
        }
      }

      let firstName = '';
      let lastName = '';
      const fullName = row['TRABAJADOR'] || row['Nombres'];
      if (fullName) {
        if (fullName.includes(',')) {
          const parts = fullName.split(',');
          lastName = parts[0].trim();
          firstName = parts[1].trim();
        } else {
          const parts = fullName.split(' ');
          lastName = parts.slice(0, 2).join(' '); // Basic fallback
          firstName = parts.slice(2).join(' ') || parts[0];
        }
      }

      return {
        document_number: String(row['DNI'] || row['document_number'] || '').trim(),
        first_name: firstName,
        last_name: lastName,
        job_title: row['PUESTO'] || row['job_title'] || 'Trabajador',
        hire_date: hire_date,
        is_active: true
      };
    }).filter(w => w.document_number); // Only keep valid rows

    if (workersData.length === 0) {
      return { success: false, error: 'No se encontraron datos válidos en el archivo' };
    }

    const { error } = await supabase
      .from('workers')
      .insert(workersData);

    if (error) {
      console.error('Error bulk inserting workers:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/workers');
    return { success: true, count: workersData.length };
  } catch (error: any) {
    console.error('Error importing workers:', error);
    return { success: false, error: error.message };
  }
}

export async function seedOfficialWorkers() {
  try {
    const supabase = await createClient()

    const officialWorkers = [
      { first_name: 'ELOY ADALICIO', last_name: 'DEL AGUILA GARAY', document_number: '42788318', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'EFRAIN CESAR', last_name: 'ESTEBAN DE LA O', document_number: '47726832', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'JHIM ROGER', last_name: 'ACOSTA TALANCHA', document_number: '41159726', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'ESTEFANI MELISSA', last_name: 'LOPEZ CAICO', document_number: '47887861', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'ADUAR RODANIN', last_name: 'CARRANZA ROMERO', document_number: '40434803', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'FRANS ANTONY', last_name: 'FLORES CUBILLOS', document_number: '73797569', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'MAYKON YAKSON', last_name: 'MELGAREJO SILVA', document_number: '43055144', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'FRANCO CHARLIES', last_name: 'ACOSTA FIGUEREDO', document_number: '73595742', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'DONY JEINER', last_name: 'MALPARTIDA DORIA', document_number: '46820231', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'WILDER JHONATAN', last_name: 'LLANTO FIGUEREDO', document_number: '46555587', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'HECTOR PEPE', last_name: 'MANDUJANO RODRIGUEZ', document_number: '40657146', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'JHONEL SEMEIAS', last_name: 'RIVERA COLLAZOS', document_number: '80350104', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'GELFREDO', last_name: 'MARTEL ROSAS', document_number: '42544452', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'LUIS ANTONIO', last_name: 'MARIN GERVACIO', document_number: '46020916', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'RODIL', last_name: 'CHAVEZ CORI', document_number: '42420568', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'JUAN CARLOS', last_name: 'MANZANO DIAZ', document_number: '45555718', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'IBAN YONI', last_name: 'ALMERCO MALPARTIDA', document_number: '10443906', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'BILE MEDARDO', last_name: 'RUBIO ATENCIA', document_number: '71580929', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'WILMER', last_name: 'MERINO NOREÑA', document_number: '44143371', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'ALEX ALESANDRO', last_name: 'CISNEROS BRAVO', document_number: '45332692', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'BERGILIO', last_name: 'CRUZ MERINO', document_number: '40222881', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'RONALDO', last_name: 'ÑAUPA CRUZ', document_number: '71300573', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'YONER', last_name: 'ALEJO RUFINO', document_number: '43348343', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'EDU LEONARDO', last_name: 'ALEJO CRISTOBAL', document_number: '61103006', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'WILFREDO TEOFILO', last_name: 'SAMUDIO FULGENCIO', document_number: '74933176', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'MICHER JHANS', last_name: 'ROJAS PEREZ', document_number: '77498608', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'CLAUDIA', last_name: 'PEREZ LEANDRO', document_number: '75013640', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'LIZ CORINA', last_name: 'CONCHA GARAY', document_number: '41366849', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'JULIA', last_name: 'PEREZ LEANDRO', document_number: '75013639', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'CLUBER', last_name: 'LLANTO RUIZ', document_number: '22410762', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'JUAN CARLOS', last_name: 'PARDAVE CAYCO', document_number: '44732050', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'ANDERSON LUIYE', last_name: 'LEANDRO SALAS', document_number: '46779509', job_title: 'Operario', hire_date: '2024-01-15', is_active: true },
      { first_name: 'LENNIN YORQUIÑO', last_name: 'ATAVILLOS MAIZ', document_number: '73265507', job_title: 'Operario', hire_date: '2024-01-15', is_active: true }
    ]

    const { data, error } = await supabase
      .from('workers')
      .upsert(officialWorkers, { onConflict: 'document_number' })
      .select()

    if (error) throw error

    revalidatePath('/workers')
    revalidatePath('/expediente')
    revalidatePath('/dashboard')
    revalidatePath('/sst/committee')

    return { success: true, count: data.length }
  } catch (err: any) {
    console.error('Error seeding official workers:', err)
    return { success: false, error: err.message }
  }
}

