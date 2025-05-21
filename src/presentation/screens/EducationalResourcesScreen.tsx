import React, { useState, useRef } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, Pressable, Platform, Animated, Modal, ScrollView, SafeAreaView } from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Linking } from 'react-native';
import tw from "twrnc";
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Navbar } from "../components/ui/navbar";
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { ResizeMode, Video } from 'expo-av';

interface FileItem {
    id: string;
    uploader: string;
    type: "pdf" | "video" | "image" | "docx";
    name: string;
    size: string;
    date: string;
    thumbnail?: string;
    duration?: string;
    pages?: number;
}
const pdfImageUrl = "../../assets/images/pdf_image.png"

const generateRandomFiles = (): FileItem[] => {
    // Existing code for generating random files
    const subjects = ['Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia'];
    const fileTypes = ['pdf', 'video', 'image', 'docx'] as const;
    const uploaders = ['João Silva', 'Maria Santos', 'Pedro Alves', 'Ana Costa', 'Carlos Lima'];
    const videoThumbnails = [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655'
    ];

    const pdfThumbnails = [
        'https://images.unsplash.com/photo-1537434328607-ddb93edba548',
        'https://images.unsplash.com/photo-1568667256549-094345857637',
        'https://images.unsplash.com/photo-1586380951230-e6703d9f6833'
    ];

    const docxThumbnails = [
        'https://images.unsplash.com/photo-1606636660801-c61b8e97a1dc',
        'https://images.unsplash.com/photo-1586380951230-e6703d9f6833',
        'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a'
    ];

    const generateRandomFile = (id: string): FileItem => {
        const type = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const uploader = uploaders[Math.floor(Math.random() * uploaders.length)];
        const thumbnail = videoThumbnails[Math.floor(Math.random() * videoThumbnails.length)];

        const baseFile = {
            id,
            uploader,
            type,
            size: `${Math.floor(Math.random() * 20) + 1} MB`,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('pt-BR')
        };

        switch (type) {
            case 'pdf':
            case 'docx':
                return {
                    ...baseFile,
                    name: type === 'pdf'
                        ? `${subject} - Aula ${Math.floor(Math.random() * 10) + 1}.${type}`
                        : `Resumo de ${subject}.${type}`,
                    pages: Math.floor(Math.random() * 50) + 1,
                    thumbnail: type === 'pdf'
                        ? pdfThumbnails[Math.floor(Math.random() * pdfThumbnails.length)]
                        : docxThumbnails[Math.floor(Math.random() * docxThumbnails.length)]
                };
            case 'video':
                return {
                    ...baseFile,
                    name: `Vídeo Aula de ${subject}`,
                    thumbnail,
                    duration: `00:${Math.floor(Math.random() * 59) + 1}:${Math.floor(Math.random() * 59) + 1}`
                };
            case 'image':
                return {
                    ...baseFile,
                    name: `Diagrama de ${subject}`,
                    thumbnail
                };
        }
    };

    return Array.from({ length: 10 }, (_, i) => generateRandomFile(String(i + 1)));
};

export function EducationalResourcesScreen() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [unpublishedFiles, setUnpublishedFiles] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [files, setFiles] = useState<FileItem[]>(generateRandomFiles());
    const [selectedCategory, setSelectedCategory] = useState<"all" | "pdf" | "video" | "image" | "docx">("all");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
    const videoRef = useRef<Video>(null);
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Add a function to handle file preview
    const handleFilePreview = (file: FileItem) => {
        setCurrentFile(file);
        setViewerVisible(true);
    };

    // Add a function to close the viewer
    const closeViewer = () => {
        setViewerVisible(false);
        setCurrentFile(null);
        if (videoRef.current) {
            videoRef.current.pauseAsync();
        }
    };


    // Filtered results
    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || file.type === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleDownload = async (file: FileItem) => {
        setDownloading(file.id);

        // Updated URLs that are CORS-friendly and publicly accessible
        const mockDownloadUrls = {
            pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            docx: 'https://calibre-ebook.com/downloads/demos/demo.docx',
            video: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
            image: file.thumbnail || 'https://picsum.photos/800/600'
        };

        try {
            const downloadUrl = mockDownloadUrls[file.type];

            if (Platform.OS === 'web') {
                const response = await fetch(downloadUrl, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    }
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.style.display = 'none';
                link.href = url;
                link.download = file.name;

                document.body.appendChild(link);
                link.click();

                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            } else {
                // Native platform code remains the same
                const filename = file.name.replace(/\s+/g, '_');
                const { uri } = await FileSystem.downloadAsync(
                    downloadUrl,
                    FileSystem.documentDirectory + filename
                );

                if (uri) {
                    await Sharing.shareAsync(uri);
                }
            }

            // Show success message
            Alert.alert('Download Concluído', `${file.name} foi baixado com sucesso.`);

        } catch (error) {
            console.log('Download error:', error);
            Alert.alert('Download Falhou', 'Não foi possível baixar o arquivo. Por favor, tente novamente.');
        } finally {
            setDownloading(null);
        }
    };

    // Upload new file
    const handleUpload = async () => {
        let result = await DocumentPicker.getDocumentAsync({});
        if (!result.canceled) {
            const file = result.assets[0];
            const newFileId = Math.random().toString();

            let thumbnail: string | undefined;

            if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
                // Store the file URI directly as thumbnail for now
                thumbnail = file.uri;
            }
            else if (file.name.endsWith('.mp4')) {
                const { uri } = await VideoThumbnails.getThumbnailAsync(
                    file.uri,
                    {
                        time: 0,
                        quality: 0.8
                    }
                );
                thumbnail = uri;
            }

            const newFile: FileItem = {
                id: newFileId,
                uploader: "Você",
                type: file.name.endsWith(".pdf") ? "pdf" :
                    file.name.endsWith(".docx") ? "docx" :
                        file.name.endsWith(".mp4") ? "video" : "image",
                name: file.name,
                size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Unknown",
                date: new Date().toLocaleDateString(),
                thumbnail: thumbnail
            };

            // Animation for new file
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true
                    })
                ]).start();
            }, 100);

            setFiles([newFile, ...files]);
            setUnpublishedFiles(prev => new Set(prev).add(newFileId));
            setShowUploadOptions(false);
        }
    };

    // Add handlePublish function
    const handlePublish = (fileId: string) => {
        setUnpublishedFiles(prev => {
            const updated = new Set(prev);
            updated.delete(fileId);
            return updated;
        });

        // Show success message
        Alert.alert('Arquivo Publicado', 'Seu arquivo foi publicado com sucesso e agora está disponível para todos os usuários.');
    };

    // Simulate refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setFiles(generateRandomFiles());
            setIsRefreshing(false);
        }, 1500);
    };

    // Get icon for file type
    const getFileTypeIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return <MaterialIcons name="picture-as-pdf" size={20} color="#FF5252" />;
            case 'video':
                return <MaterialIcons name="videocam" size={20} color="#4CAF50" />;
            case 'image':
                return <MaterialIcons name="image" size={20} color="#2196F3" />;
            case 'docx':
                return <MaterialIcons name="description" size={20} color="#673AB7" />;
            default:
                return <MaterialIcons name="insert-drive-file" size={20} color="#607D8B" />;
        }
    };

    // Get color for file type
    const getFileTypeColor = (type: string) => {
        switch (type) {
            case 'pdf': return 'bg-red-500';
            case 'video': return 'bg-green-500';
            case 'image': return 'bg-blue-500';
            case 'docx': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            {/* Header */}
            <Navbar title="Recursos Educacionais" />

            {/* Search and Filter Section */}
            <View style={tw`px-4 py-3 bg-[#F7F7F7] shadow-sm`}>
                {/* Search Bar */}
                <View style={tw`flex-row items-center bg-gray-100 px-4 py-2 rounded-full`}>
                    <Ionicons name="search" size={20} color="gray" />
                    <TextInput
                        placeholder="Pesquisar materiais..."
                        style={tw`flex-1 ml-2 text-gray-700`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="gray" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => setShowUploadOptions(!showUploadOptions)}>
                            <Ionicons name="add-circle" size={24} color="#4F46E5" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={tw`mt-3`}
                    contentContainerStyle={tw`pb-2`}
                >
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === "all" ? "bg-indigo-600" : "bg-white"}`}
                        onPress={() => setSelectedCategory("all")}
                    >
                        <Text style={tw`${selectedCategory === "all" ? "text-white" : "text-gray-700"}`}>Todos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === "pdf" ? "bg-red-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory("pdf")}
                    >
                        <Text style={tw`${selectedCategory === "pdf" ? "text-white" : "text-gray-700"}`}>PDFs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === "video" ? "bg-green-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory("video")}
                    >
                        <Text style={tw`${selectedCategory === "video" ? "text-white" : "text-gray-700"}`}>Vídeos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === "image" ? "bg-blue-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory("image")}
                    >
                        <Text style={tw`${selectedCategory === "image" ? "text-white" : "text-gray-700"}`}>Imagens</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === "docx" ? "bg-purple-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory("docx")}
                    >
                        <Text style={tw`${selectedCategory === "docx" ? "text-white" : "text-gray-700"}`}>Documentos</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Upload Options Modal */}
            {showUploadOptions && (
                <View style={tw`absolute top-24 right-4 bg-white rounded-xl shadow-xl z-10 w-60 overflow-hidden`}>
                    <TouchableOpacity
                        style={tw`flex-row items-center p-4 border-b border-gray-100`}
                        onPress={handleUpload}
                    >
                        <Ionicons name="document-text" size={24} color="#4F46E5" />
                        <Text style={tw`ml-3 text-gray-800`}>Carregar documento</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`flex-row items-center p-4 border-b border-gray-100`}
                        onPress={handleUpload}
                    >
                        <Ionicons name="videocam" size={24} color="#4F46E5" />
                        <Text style={tw`ml-3 text-gray-800`}>Carregar vídeo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`flex-row items-center p-4`}
                        onPress={handleUpload}
                    >
                        <Ionicons name="image" size={24} color="#4F46E5" />
                        <Text style={tw`ml-3 text-gray-800`}>Carregar imagem</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Files List */}
            <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4 pb-20`}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                renderItem={({ item, index }) => (
                    <Animated.View
                        style={[
                            tw`bg-white rounded-xl shadow-sm mb-4 overflow-hidden`,
                            unpublishedFiles.has(item.id) && {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {/* File Preview */}
                        {(item.type === "video" || item.type === "image") && (
                            <TouchableOpacity
                                style={tw`relative`}
                                onPress={() => handleFilePreview(item)}
                            >
                                <Image
                                    source={{ uri: item.thumbnail }}
                                    style={tw`w-full h-48 object-cover`}
                                />
                                {item.type === "video" && (
                                    <View style={tw`absolute inset-0 flex items-center justify-center`}>
                                        <View style={tw`bg-black bg-opacity-50 rounded-full p-3`}>
                                            <Ionicons name="play" size={30} color="white" />
                                        </View>
                                        {item.duration && (
                                            <View style={tw`absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded`}>
                                                <Text style={tw`text-white text-xs`}>{item.duration}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={tw`absolute bottom-0 left-0 right-0 h-16`}
                                />
                                <View style={tw`absolute top-2 left-2 px-2 py-1 rounded-full ${getFileTypeColor(item.type)}`}>
                                    <Text style={tw`text-white text-xs font-medium`}>
                                        {item.type.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Document Preview */}
                        {(item.type === "pdf" || item.type === "docx") && (
                            <TouchableOpacity
                                style={tw`relative bg-gray-100 h-24 flex-row items-center p-4`}
                                onPress={() => handleFilePreview(item)}
                            >
                                <View style={tw`w-16 h-16 rounded-lg bg-white shadow-sm items-center justify-center`}>
                                    {item.type === "pdf" ? (
                                        <Ionicons name="document-text" size={30} color="#FF5252" />
                                    ) : (
                                        <Ionicons name="document" size={30} color="#673AB7" />
                                    )}
                                </View>
                                <View style={tw`ml-4 flex-1`}>
                                    <Text style={tw`text-lg font-medium text-gray-800`} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    {item.pages && (
                                        <Text style={tw`text-gray-500 text-sm`}>
                                            {item.pages} páginas
                                        </Text>
                                    )}
                                </View>
                                <View style={tw`absolute top-2 right-2 px-2 py-1 rounded-full ${getFileTypeColor(item.type)}`}>
                                    <Text style={tw`text-white text-xs font-medium`}>
                                        {item.type.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* File Info */}
                        <View style={tw`p-4`}>
                            <View style={tw`flex-row justify-between items-center mb-2`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-8 h-8 rounded-full bg-indigo-100 items-center justify-center`}>
                                        <Text style={tw`text-indigo-600 font-bold`}>{item.uploader.charAt(0)}</Text>
                                    </View>
                                    <Text style={tw`ml-2 font-medium text-gray-800`}>{item.uploader}</Text>
                                </View>
                                <Text style={tw`text-xs text-gray-500`}>{item.date}</Text>
                            </View>

                            <Text style={tw`text-gray-800 font-medium mb-2`} numberOfLines={2}>
                                {item.name}
                            </Text>

                            <View style={tw`flex-row justify-between items-center`}>
                                <Text style={tw`text-xs text-gray-500`}>{item.size}</Text>

                                {/* Download/Publish Button */}
                                <TouchableOpacity
                                    style={tw`${downloading === item.id ? 'bg-gray-400' : unpublishedFiles.has(item.id) ? 'bg-green-500' : 'bg-indigo-600'} px-4 py-2 rounded-lg flex-row items-center`}
                                    onPress={() => unpublishedFiles.has(item.id) ? handlePublish(item.id) : handleDownload(item)}
                                    disabled={downloading === item.id}
                                >
                                    {downloading === item.id ? (
                                        <>
                                            <Ionicons name="cloud-download" size={18} color="white" />
                                            <Text style={tw`ml-2 text-sm font-medium text-white`}>Baixando...</Text>
                                        </>
                                    ) : unpublishedFiles.has(item.id) ? (
                                        <>
                                            <Ionicons name="cloud-upload" size={18} color="white" />
                                            <Text style={tw`ml-2 text-sm font-medium text-white`}>Publicar</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="download" size={18} color="white" />
                                            <Text style={tw`ml-2 text-sm font-medium text-white`}>Baixar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                )}
                ListEmptyComponent={() => (
                    <View style={tw`items-center justify-center py-20`}>
                        <Ionicons name="document-text-outline" size={60} color="#CBD5E0" />
                        <Text style={tw`mt-4 text-gray-500 text-lg font-medium`}>Nenhum recurso encontrado</Text>
                        <Text style={tw`mt-2 text-gray-400 text-center px-10`}>
                            {searchQuery ?
                                `Não encontramos resultados para "${searchQuery}"` :
                                "Adicione novos recursos educacionais para compartilhar com seus alunos"}
                        </Text>
                        <TouchableOpacity
                            style={tw`mt-6 bg-indigo-600 px-6 py-3 rounded-full flex-row items-center`}
                            onPress={handleUpload}
                        >
                            <Ionicons name="add-circle" size={20} color="white" />
                            <Text style={tw`ml-2 text-white font-medium`}>Adicionar Recurso</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={tw`absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full items-center justify-center shadow-lg`}
                onPress={handleUpload}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>


            {/* File Viewer Modal */}
            <Modal
                visible={viewerVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={closeViewer}
            >
                <SafeAreaView style={tw`flex-1 bg-black`}>
                    {/* Header */}
                    <View style={tw`flex-row items-center justify-between p-4 bg-gray-900`}>
                        <TouchableOpacity onPress={closeViewer}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                        <Text style={tw`text-white font-medium text-lg`} numberOfLines={1}>
                            {currentFile?.name}
                        </Text>
                        <TouchableOpacity onPress={() => currentFile && handleDownload(currentFile)}>
                            <Ionicons name="download" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Content Viewer */}
                    <View style={tw`flex-1 justify-center items-center bg-black`}>
                        {currentFile?.type === "image" && (
                            <ScrollView
                                contentContainerStyle={tw`flex-1 justify-center items-center`}
                                maximumZoomScale={3}
                                minimumZoomScale={1}
                            >
                                <Image
                                    source={{ uri: currentFile.thumbnail }}
                                    style={tw`w-full h-full`}
                                    resizeMode="contain"
                                />
                            </ScrollView>
                        )}

                        {currentFile?.type === "video" && (
                            <Video
                                ref={videoRef}
                                source={{ uri: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4' }}
                                style={tw`w-full h-64`}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping
                                shouldPlay
                            />
                        )}

                        {currentFile?.type === "pdf" && (
                            <WebView
                                source={{ uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }}
                                style={tw`w-full flex-1`}
                            />
                        )}

                        {currentFile?.type === "docx" && (
                            <View style={tw`flex-1 justify-center items-center p-6`}>
                                <Ionicons name="document-text" size={80} color="#673AB7" />
                                <Text style={tw`text-white text-lg mt-4 text-center`}>
                                    Visualização de documentos DOCX não está disponível diretamente.
                                </Text>
                                <TouchableOpacity
                                    style={tw`mt-6 bg-indigo-600 px-6 py-3 rounded-full`}
                                    onPress={() => currentFile && handleDownload(currentFile)}
                                >
                                    <Text style={tw`text-white font-medium`}>Baixar para visualizar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
