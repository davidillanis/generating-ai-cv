import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CVFile, Folder } from '../types';
import { supabase } from '../services/supabase';

const Repository: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<CVFile[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<CVFile | null>(null);
    const [previewFile, setPreviewFile] = useState<CVFile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Folder Management State
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [folderModalMode, setFolderModalMode] = useState<'create' | 'edit'>('create');
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [folderNameInput, setFolderNameInput] = useState('');

    // Fetch initial data
    useEffect(() => {
        if (user) {
            fetchFolders();
        }
    }, [user]);

    useEffect(() => {
        if (user && activeFolderId) {
            fetchFiles(activeFolderId);
        } else if (folders.length > 0 && !activeFolderId) {
            // Default to first folder if none selected
            setActiveFolderId(folders[0].id);
        }
    }, [user, activeFolderId, folders]);


    const fetchFolders = async () => {
        try {
            const { data, error } = await supabase
                .from('user_folders')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setFolders(data || []);
            // Set active directory to first one if valid and not set
            if (data && data.length > 0 && !activeFolderId) {
                setActiveFolderId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
        }
    };

    const fetchFiles = async (folderId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_files')
                .select('*')
                .eq('user_id', user!.id)
                .eq('folder_id', folderId)
                .order('upload_date', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedFiles: CVFile[] = data.map(f => {
                    const { data: publicUrlData } = supabase.storage
                        .from('repository_files')
                        .getPublicUrl(f.file_path);

                    return {
                        id: f.id,
                        name: f.name,
                        description: f.description || '',
                        uploadDate: f.upload_date,
                        folderId: f.folder_id,
                        type: f.type,
                        size: f.size,
                        filePath: f.file_path,
                        url: publicUrlData.publicUrl
                    };
                });
                setFiles(mappedFiles);
            } else {
                setFiles([]);
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !activeFolderId) return;

        try {
            setUploading(true);

            // Sanitize filename
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${user.id}/${Date.now()}_${sanitizedName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('repository_files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Insert record into DB
            const { error: dbError } = await supabase
                .from('user_files')
                .insert({
                    user_id: user.id,
                    name: file.name,
                    description: '',
                    folder_id: activeFolderId,
                    type: file.type,
                    size: file.size,
                    file_path: filePath
                });

            if (dbError) throw dbError;

            // 3. Refresh list
            await fetchFiles(activeFolderId);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al subir el archivo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (file: CVFile) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;
        if (!file.filePath) return;

        try {
            const { error: storageError } = await supabase.storage
                .from('repository_files')
                .remove([file.filePath]);

            if (storageError) console.error('Storage delete error:', storageError);

            const { error: dbError } = await supabase
                .from('user_files')
                .delete()
                .eq('id', file.id);

            if (dbError) throw dbError;

            setFiles(prev => prev.filter(f => f.id !== file.id));
            if (previewFile?.id === file.id) setPreviewFile(null);
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error al eliminar el archivo');
        }
    };

    const handleDownload = (file: CVFile) => {
        if (file.url) {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const openEditModal = (file: CVFile) => {
        setEditingFile({ ...file });
        setIsEditModalOpen(true);
    };

    const saveEdit = async () => {
        if (!editingFile) return;

        try {
            const { error } = await supabase
                .from('user_files')
                .update({
                    name: editingFile.name,
                    description: editingFile.description,
                    folder_id: editingFile.folderId,
                    upload_date: editingFile.uploadDate
                })
                .eq('id', editingFile.id);

            if (error) throw error;

            // If folder changed, remove from current view
            if (editingFile.folderId !== activeFolderId) {
                setFiles(prev => prev.filter(f => f.id !== editingFile.id));
            } else {
                setFiles(prev => prev.map(f => f.id === editingFile.id ? editingFile : f));
            }

            setIsEditModalOpen(false);
            setEditingFile(null);
        } catch (error) {
            console.error('Error updating file:', error);
            alert('Error al actualizar el archivo');
        }
    };

    // Folder Operations
    const handleCreateFolder = () => {
        setFolderModalMode('create');
        setFolderNameInput('');
        setCurrentFolder(null);
        setIsFolderModalOpen(true);
    };

    const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
        e.stopPropagation();
        setFolderModalMode('edit');
        setFolderNameInput(folder.name);
        setCurrentFolder(folder);
        setIsFolderModalOpen(true);
    };

    const handleDeleteFolder = async (folder: Folder, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de eliminar la carpeta "${folder.name}"? Los archivos dentro deberán eliminarse primero o no podrás borrarla.`)) return;

        try {
            // Check if folder has files
            const { count, error: countError } = await supabase
                .from('user_files')
                .select('*', { count: 'exact', head: true })
                .eq('folder_id', folder.id);

            if (countError) throw countError;

            if (count && count > 0) {
                alert(`No se puede eliminar la carpeta porque contiene ${count} archivos. Por favor, elimina o mueve los archivos antes.`);
                return;
            }

            const { error } = await supabase
                .from('user_folders')
                .delete()
                .eq('id', folder.id);

            if (error) throw error;

            setFolders(prev => prev.filter(f => f.id !== folder.id));
            if (activeFolderId === folder.id) {
                setActiveFolderId(null); // Will trigger default selection
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert('Error al eliminar la carpeta');
        }
    };

    const saveFolder = async () => {
        if (!folderNameInput.trim() || !user) return;

        try {
            if (folderModalMode === 'create') {
                const { data, error } = await supabase
                    .from('user_folders')
                    .insert({
                        user_id: user.id,
                        name: folderNameInput
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setFolders(prev => [...prev, data]);
                    setActiveFolderId(data.id);
                }
            } else {
                if (!currentFolder) return;
                const { error } = await supabase
                    .from('user_folders')
                    .update({ name: folderNameInput })
                    .eq('id', currentFolder.id);

                if (error) throw error;
                setFolders(prev => prev.map(f => f.id === currentFolder.id ? { ...f, name: folderNameInput } : f));
            }
            setIsFolderModalOpen(false);
        } catch (error) {
            console.error('Error saving folder:', error);
            alert('Error al guardar la carpeta');
        }
    };


    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const activeFolderName = folders.find(f => f.id === activeFolderId)?.name || 'Cargando...';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="px-6 py-4 bg-white border-b flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                    <span className="font-black text-lg">CV IA PRO</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                        Mis CVs
                    </button>
                    <button className="text-sm font-bold text-primary">
                        Repositorio
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                    <span className="text-sm font-medium text-slate-600 hidden md:block">{user?.email}</span>
                    <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                        {user?.email?.charAt(0) || 'U'}
                    </div>
                    <button onClick={() => signOut()} className="text-sm text-slate-500 hover:text-red-500 font-medium ml-2">
                        Salir
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-grow flex flex-col md:flex-row gap-8">

                {/* Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-slate-900">Carpetas</h2>
                            <button
                                onClick={handleCreateFolder}
                                className="size-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-colors tooltip"
                                title="Nueva Carpeta"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                            {folders.map(folder => (
                                <div
                                    key={folder.id}
                                    onClick={() => setActiveFolderId(folder.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer group relative ${activeFolderId === folder.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">folder</span>
                                    <span className="truncate flex-grow">{folder.name}</span>

                                    <div className={`flex items-center gap-1 absolute right-2 bg-inherit px-1 ${activeFolderId === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                        <button
                                            onClick={(e) => handleEditFolder(folder, e)}
                                            className="p-1 hover:bg-black/10 rounded"
                                            title="Editar nombre"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteFolder(folder, e)}
                                            className="p-1 hover:bg-black/10 rounded hover:text-red-200"
                                            title="Eliminar carpeta"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {folders.length === 0 && (
                                <div className="text-center p-4 py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-sm text-slate-400">Sin carpetas</p>
                                    <button onClick={handleCreateFolder} className="text-primary text-xs font-bold mt-2 hover:underline">Crear una</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-purple-600">info</span>
                            <div>
                                <h4 className="font-bold text-purple-900 text-sm">Organiza tu Documentación</h4>
                                <p className="text-purple-700 text-xs mt-1">Crea carpetas personalizadas para mantener tus archivos ordenados.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <div className="flex-grow space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{activeFolderName}</h1>
                            <p className="text-slate-500 text-sm">Gestión de archivos y documentos</p>
                        </div>
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={uploading || !activeFolderId}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading || !activeFolderId}
                                className={`bg-primary text-white h-10 px-5 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:bg-primary-hover transition-all ${(uploading || !activeFolderId) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {uploading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-xl">upload</span>
                                        Subir Archivo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-slate-400">topic</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Carpeta Vacía</h3>
                            <p className="text-slate-500 mt-1 max-w-xs">No hay archivos en esta carpeta. Sube un documento para comenzar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {files.map(file => (
                                <div key={file.id} className="bg-white p-4 rounded-xl border hover:shadow-md transition-all flex items-center gap-4 group">
                                    <div
                                        onClick={() => setPreviewFile(file)}
                                        className="size-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 overflow-hidden cursor-pointer relative border border-slate-200 hover:border-primary/50 transition-colors"
                                    >
                                        {file.type.includes('image') && file.url ? (
                                            <img src={file.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined">
                                                {file.type.includes('image') ? 'image' :
                                                    file.type.includes('pdf') ? 'picture_as_pdf' : 'description'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate cursor-pointer hover:text-primary transition-colors" onClick={() => setPreviewFile(file)}>{file.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span>{formatSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                                            {file.description && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[200px]">{file.description}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setPreviewFile(file)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 tooltip"
                                            title="Vista Previa"
                                        >
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 tooltip"
                                            title="Descargar"
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                        </button>
                                        <button
                                            onClick={() => openEditModal(file)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                                            title="Editar Info"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                            title="Eliminar"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>

            {/* Folder Modal */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                {folderModalMode === 'create' ? 'Nueva Carpeta' : 'Editar Carpeta'}
                            </h3>
                            <button onClick={() => setIsFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={folderNameInput}
                                    onChange={(e) => setFolderNameInput(e.target.value)}
                                    placeholder="Ej: Certificados"
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-primary focus:border-primary border"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsFolderModalOpen(false)}
                                className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveFolder}
                                disabled={!folderNameInput.trim()}
                                className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-hover shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit (File) Modal */}
            {isEditModalOpen && editingFile && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Editar Archivo</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={editingFile.name}
                                    onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-primary focus:border-primary border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <textarea
                                    value={editingFile.description}
                                    onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-primary focus:border-primary border resize-none h-24"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Carpeta</label>
                                <select
                                    value={editingFile.folderId}
                                    onChange={(e) => setEditingFile({ ...editingFile, folderId: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-primary focus:border-primary border"
                                >
                                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveEdit}
                                className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-hover shadow-lg"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                    <span className="material-symbols-outlined">
                                        {previewFile.type.includes('image') ? 'image' :
                                            previewFile.type.includes('pdf') ? 'picture_as_pdf' : 'description'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 truncate max-w-md">{previewFile.name}</h3>
                                    <p className="text-xs text-slate-500">Vista previa del archivo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(previewFile)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-primary font-medium text-sm flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">download</span>
                                    <span className="hidden sm:inline">Descargar</span>
                                </button>
                                <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow bg-slate-100 overflow-auto flex items-center justify-center p-4">
                            {previewFile.type.includes('image') ? (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-full object-contain shadow-lg rounded"
                                />
                            ) : previewFile.type.includes('pdf') && previewFile.url ? (
                                <iframe
                                    src={previewFile.url}
                                    className="w-full h-full rounded shadow-sm bg-white"
                                    title="PDF Preview"
                                ></iframe>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="size-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                        <span className="material-symbols-outlined text-5xl">visibility_off</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Vista previa no disponible</h4>
                                        <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                                            {previewFile.url ? 'Este tipo de archivo no admite vista previa directa.' : 'El archivo no tiene una URL válida para previsualizar.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(previewFile)}
                                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-lg inline-flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">download</span> Descargar Archivo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Repository;
