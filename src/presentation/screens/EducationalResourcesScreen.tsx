import { useAuth } from '@/src/context/AuthContext';
import { useEducationalResources } from '@/src/hooks/useEducationalResources';
import type {
    IEducationalResource,
    IResourceFilters,
    ResourceType
} from '@/src/interfaces/educational-resources.interface';
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from 'expo-av';
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, FlatList, Image, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from 'react-native-webview';
import tw from "twrnc";
import { Navbar } from "../components/ui/navbar";
import { roleOptions } from '@/src/utils';

export function EducationalResourcesScreen() {
    // API and auth hooks
    const {
        getResources,
        uploadResource,
        generateDownloadLink,
        publishResource,
        deleteResource,
        isLoading,
        error,
        canUserUpload,
        canUserManage,
        getFileTypeIcon,
        getFileTypeColor,
        formatFileSize,
        ResourceType,
        AccessLevel
    } = useEducationalResources();
    const { user } = useAuth();

    // State management
    const [resources, setResources] = useState<IEducationalResource[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ResourceType | "all">("all");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentResource, setCurrentResource] = useState<IEducationalResource | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const videoRef = useRef<Video>(null);

    // Load resources on mount and when filters change
    useEffect(() => {
        const loadResources = async () => {
            const filters: IResourceFilters = {
                search: searchQuery || undefined,
                type: selectedCategory === "all" ? undefined : selectedCategory,
                page: 1,
                limit: 20,
                sortBy: 'uploadDate',
                sortOrder: 'desc'
            };

            const result = await getResources(filters);
            if (result) {
                setResources(result.resources);
                setPage(result.page);
                setTotalPages(result.totalPages);
                setHasNextPage(result.hasNext);
            }
        };

        loadResources();
    }, [searchQuery, selectedCategory]);

    // Load resources from API (for refresh and pagination)
    const loadResources = useCallback(async (newPage = 1, append = false) => {
        const filters: IResourceFilters = {
            search: searchQuery || undefined,
            type: selectedCategory === "all" ? undefined : selectedCategory,
            page: newPage,
            limit: 20,
            sortBy: 'uploadDate',
            sortOrder: 'desc'
        };

        const result = await getResources(filters);
        if (result) {
            if (append) {
                setResources(prev => [...prev, ...result.resources]);
            } else {
                setResources(result.resources);
            }
            setPage(result.page);
            setTotalPages(result.totalPages);
            setHasNextPage(result.hasNext);
        }
    }, [searchQuery, selectedCategory, getResources]);

    // Handle file preview
    const handleFilePreview = (resource: IEducationalResource) => {
        setCurrentResource(resource);
        setViewerVisible(true);
    };

    // Close viewer
    const closeViewer = () => {
        setViewerVisible(false);
        setCurrentResource(null);
        if (videoRef.current) {
            videoRef.current.pauseAsync();
        }
    };

    // Handle download
    const handleDownload = async (resource: IEducationalResource) => {
        if (!resource.canDownload) {
            Alert.alert('Acesso Negado', 'Você não tem permissão para baixar este recurso.');
            return;
        }

        setDownloading(resource.id);

        try {
            const downloadResponse = await generateDownloadLink(resource.id);
            if (!downloadResponse) {
                throw new Error('Falha ao gerar link de download');
            }

            if (Platform.OS === 'web') {
                // For web, open download URL in new tab
                window.open(downloadResponse.downloadUrl, '_blank');
            } else {
                // For mobile, use Sharing
                const filename = resource.name.replace(/\s+/g, '_');
                const { uri } = await FileSystem.downloadAsync(
                    downloadResponse.downloadUrl,
                    FileSystem.documentDirectory + filename
                );

                if (uri) {
                    await Sharing.shareAsync(uri, {
                        dialogTitle: `Compartilhar ${resource.name}`
                    });
                }
            }

            Alert.alert('Download Concluído', `${resource.name} foi baixado com sucesso.`);

        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Download Falhou', 'Não foi possível baixar o arquivo. Por favor, tente novamente.');
        } finally {
            setDownloading(null);
        }
    };

    // Handle upload
    const handleUpload = async () => {
        console.log('Upload button pressed ', user?.role);
        if (!canUserUpload(roleOptions[user?.role as keyof typeof roleOptions])) {
            Alert.alert('Acesso Negado', 'Você não tem permissão para fazer upload de recursos.');
            return;
        }

        try {
            let result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                const file = result.assets[0];
                setShowUploadModal(true);
                setUploadProgress(0);

                const uploadData = {
                    name: file.name,
                    description: `Recurso educacional: ${file.name}`,
                    tags: [],
                    subject: '',
                    educationLevel: undefined,
                    accessLevel: AccessLevel.SCHOOL_ONLY,
                    isPublished: false
                };

                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return prev;
                        }
                        return prev + 10;
                    });
                }, 500);

                // Convert file for upload
                const fileForUpload = {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream'
                };

                const uploadedResource = await uploadResource(fileForUpload, uploadData);

                clearInterval(progressInterval);
                setUploadProgress(100);

                if (uploadedResource) {
                    // Animation for new resource
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

                    // Refresh the resources list
                    loadResources(1, false);

                    Alert.alert('Upload Concluído', 'Seu recurso foi carregado com sucesso!');
                } else {
                    Alert.alert('Erro no Upload', 'Não foi possível carregar o arquivo.');
                }

                setShowUploadModal(false);
                setShowUploadOptions(false);
                setUploadProgress(0);
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Erro no Upload', 'Não foi possível carregar o arquivo.');
            setShowUploadModal(false);
            setUploadProgress(0);
        }
    };

    // Handle publish
    const handlePublish = async (resourceId: string) => {
        if (!canUserManage(user?.role)) {
            Alert.alert('Acesso Negado', 'Você não tem permissão para publicar recursos.');
            return;
        }

        try {
            const publishedResource = await publishResource(resourceId);
            if (publishedResource) {
                // Update the resource in the local state
                setResources(prev => prev.map(resource =>
                    resource.id === resourceId
                        ? { ...resource, isPublished: true, publishedAt: new Date() }
                        : resource
                ));

                Alert.alert('Recurso Publicado', 'Seu recurso foi publicado com sucesso e agora está disponível para todos os usuários.');
            }
        } catch (error) {
            console.error('Publish error:', error);
            Alert.alert('Erro ao Publicar', 'Não foi possível publicar o recurso.');
        }
    };

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadResources(1, false);
        setIsRefreshing(false);
    }, [loadResources]);

    // Load more resources (pagination)
    const loadMoreResources = () => {
        if (!isLoading && hasNextPage) {
            loadResources(page + 1, true);
        }
    };

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            {/* Header */}
            <Navbar title="Recursos Educacionais" />

            {/* Search and Filter Section */}
            <View style={tw`px-4 py-3 bg-[#F7F7F7] shadow-sm`}>
                {/* Search Bar */}
                <View style={tw`flex-row items-center bg-gray-200 px-4 py-2 rounded-full`}>
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
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === ResourceType.PDF ? "bg-red-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory(ResourceType.PDF)}
                    >
                        <Text style={tw`${selectedCategory === ResourceType.PDF ? "text-white" : "text-gray-700"}`}>PDFs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === ResourceType.VIDEO ? "bg-green-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory(ResourceType.VIDEO)}
                    >
                        <Text style={tw`${selectedCategory === ResourceType.VIDEO ? "text-white" : "text-gray-700"}`}>Vídeos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === ResourceType.IMAGE ? "bg-blue-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory(ResourceType.IMAGE)}
                    >
                        <Text style={tw`${selectedCategory === ResourceType.IMAGE ? "text-white" : "text-gray-700"}`}>Imagens</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={tw`px-4 py-2 rounded-full mr-2 ${selectedCategory === ResourceType.DOCX ? "bg-purple-500" : "bg-white"}`}
                        onPress={() => setSelectedCategory(ResourceType.DOCX)}
                    >
                        <Text style={tw`${selectedCategory === ResourceType.DOCX ? "text-white" : "text-gray-700"}`}>Documentos</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Upload Options Modal */}
            {showUploadOptions && (
                <>
                    {/* Backdrop to close modal when clicking outside */}
                    <TouchableOpacity
                        style={tw`absolute inset-0 z-5`}
                        onPress={() => setShowUploadOptions(false)}
                        activeOpacity={1}
                    />
                    <View style={tw`absolute top-30 right-4 bg-white rounded-xl shadow-xl z-10 w-60 overflow-hidden`}>
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
                </>
            )}

            {/* Resources List */}
            <FlatList
                data={resources}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-4 pb-20`}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                onEndReached={loadMoreResources}
                onEndReachedThreshold={0.1}
                renderItem={({ item, index }) => (
                    <Animated.View
                        style={[
                            tw`bg-white rounded-xl shadow-sm mb-4 overflow-hidden`,
                            !item.isPublished && {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {/* Resource Preview */}
                        {(item.type === ResourceType.VIDEO || item.type === ResourceType.IMAGE) && (
                            <TouchableOpacity
                                style={tw`relative`}
                                onPress={() => handleFilePreview(item)}
                            >
                                <Image
                                    source={{ uri: item.thumbnail || 'https://via.placeholder.com/400x200?text=Preview' }}
                                    style={tw`w-full h-48 object-cover`}
                                />
                                {item.type === ResourceType.VIDEO && (
                                    <View style={tw`absolute inset-0 flex items-center justify-center`}>
                                        <View style={tw`bg-black bg-opacity-50 rounded-full p-3`}>
                                            <Ionicons name="play" size={30} color="white" />
                                        </View>
                                        {item.durationFormatted && (
                                            <View style={tw`absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded`}>
                                                <Text style={tw`text-white text-xs`}>{item.durationFormatted}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={tw`absolute bottom-0 left-0 right-0 h-16`}
                                />
                                <View style={[tw`absolute top-2 left-2 px-2 py-1 rounded-full`,
                                { backgroundColor: getFileTypeColor(item.type) }]}>
                                    <Text style={tw`text-white text-xs font-medium`}>
                                        {item.type.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Document Preview */}
                        {(item.type === ResourceType.PDF || item.type === ResourceType.DOCX) && (
                            <TouchableOpacity
                                style={tw`relative bg-gray-100 h-24 flex-row items-center p-4`}
                                onPress={() => handleFilePreview(item)}
                            >
                                <View style={tw`w-16 h-16 rounded-lg bg-white shadow-sm items-center justify-center`}>
                                    <Ionicons
                                        name={getFileTypeIcon(item.type) as any}
                                        size={30}
                                        color={getFileTypeColor(item.type)}
                                    />
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
                                <View style={[tw`absolute top-2 right-2 px-2 py-1 rounded-full`,
                                { backgroundColor: getFileTypeColor(item.type) }]}>
                                    <Text style={tw`text-white text-xs font-medium`}>
                                        {item.type.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Resource Info */}
                        <View style={tw`p-4`}>
                            <View style={tw`flex-row justify-between items-center mb-2`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-8 h-8 rounded-full bg-indigo-100 items-center justify-center`}>
                                        <Text style={tw`text-indigo-600 font-bold`}>{item.uploader.fullName.charAt(0)}</Text>
                                    </View>
                                    <Text style={tw`ml-2 font-medium text-gray-800`}>{item.uploader.fullName}</Text>
                                </View>
                                <Text style={tw`text-xs text-gray-500`}>
                                    {new Date(item.uploadDate).toLocaleDateString('pt-BR')}
                                </Text>
                            </View>

                            <Text style={tw`text-gray-800 font-medium mb-2`} numberOfLines={2}>
                                {item.name}
                            </Text>

                            {/* Tags */}
                            {item.tags.length > 0 && (
                                <View style={tw`flex-row flex-wrap mb-2`}>
                                    {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                        <View key={tagIndex} style={tw`bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1`}>
                                            <Text style={tw`text-xs text-gray-600`}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={tw`flex-row justify-between items-center`}>
                                <View style={tw`flex-row items-center`}>
                                    <Text style={tw`text-xs text-gray-500 mr-3`}>{item.sizeFormatted}</Text>
                                    {item.downloadCount > 0 && (
                                        <Text style={tw`text-xs text-gray-500`}>
                                            {item.downloadCount} downloads
                                        </Text>
                                    )}
                                </View>

                                {/* Action Button */}
                                <View style={tw`flex-row items-center`}>
                                    {!item.isPublished && item.canPublish && (
                                        <TouchableOpacity
                                            style={tw`bg-green-500 px-3 py-2 rounded-lg flex-row items-center mr-2`}
                                            onPress={() => handlePublish(item.id)}
                                        >
                                            <Ionicons name="cloud-upload" size={16} color="white" />
                                            <Text style={tw`ml-1 text-xs font-medium text-white`}>Publicar</Text>
                                        </TouchableOpacity>
                                    )}

                                    {item.canDownload && (
                                        <TouchableOpacity
                                            style={tw`${downloading === item.id ? 'bg-gray-400' : 'bg-indigo-600'} px-3 py-2 rounded-lg flex-row items-center`}
                                            onPress={() => handleDownload(item)}
                                            disabled={downloading === item.id}
                                        >
                                            {downloading === item.id ? (
                                                <>
                                                    <Ionicons name="hourglass" size={16} color="white" />
                                                    <Text style={tw`ml-1 text-xs font-medium text-white`}>Baixando...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="download" size={16} color="white" />
                                                    <Text style={tw`ml-1 text-xs font-medium text-white`}>Baixar</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
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
                                "Explore recursos educacionais ou adicione novos materiais"}
                        </Text>
                        {canUserUpload(user?.role) && (
                            <TouchableOpacity
                                style={tw`mt-6 bg-indigo-600 px-6 py-3 rounded-full flex-row items-center`}
                                onPress={handleUpload}
                            >
                                <Ionicons name="add-circle" size={20} color="white" />
                                <Text style={tw`ml-2 text-white font-medium`}>Adicionar Recurso</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

            {/* Floating Action Button - Only for users who can upload */}
            {canUserUpload(user?.role) && (
                <TouchableOpacity
                    style={tw`absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full items-center justify-center shadow-lg`}
                    onPress={handleUpload}
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            )}


            {/* Resource Viewer Modal */}
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
                            {currentResource?.name}
                        </Text>
                        <TouchableOpacity
                            onPress={() => currentResource && handleDownload(currentResource)}
                            disabled={!currentResource?.canDownload}
                        >
                            <Ionicons
                                name="download"
                                size={24}
                                color={currentResource?.canDownload ? "white" : "#666"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Content Viewer */}
                    <View style={tw`flex-1 justify-center items-center bg-black`}>
                        {currentResource?.type === ResourceType.IMAGE && (
                            <ScrollView
                                contentContainerStyle={tw`flex-1 justify-center items-center`}
                                maximumZoomScale={3}
                                minimumZoomScale={1}
                            >
                                <Image
                                    source={{ uri: currentResource.thumbnail || currentResource.downloadUrl }}
                                    style={tw`w-full h-full`}
                                    resizeMode="contain"
                                />
                            </ScrollView>
                        )}

                        {currentResource?.type === ResourceType.VIDEO && (
                            <Video
                                ref={videoRef}
                                source={{ uri: currentResource.downloadUrl }}
                                style={tw`w-full h-64`}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping
                                shouldPlay
                            />
                        )}

                        {currentResource?.type === ResourceType.PDF && (
                            <WebView
                                source={{ uri: currentResource.downloadUrl }}
                                style={tw`w-full flex-1`}
                            />
                        )}

                        {(currentResource?.type === ResourceType.DOCX ||
                            currentResource?.type === ResourceType.PPTX ||
                            currentResource?.type === ResourceType.XLSX) && (
                                <View style={tw`flex-1 justify-center items-center p-6`}>
                                    <Ionicons
                                        name={getFileTypeIcon(currentResource.type) as any}
                                        size={80}
                                        color={getFileTypeColor(currentResource.type)}
                                    />
                                    <Text style={tw`text-white text-lg mt-4 text-center`}>
                                        Visualização de documentos {currentResource.type.toUpperCase()} não está disponível diretamente.
                                    </Text>
                                    {currentResource.canDownload && (
                                        <TouchableOpacity
                                            style={tw`mt-6 bg-indigo-600 px-6 py-3 rounded-full`}
                                            onPress={() => handleDownload(currentResource)}
                                        >
                                            <Text style={tw`text-white font-medium`}>Baixar para visualizar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Upload Progress Modal */}
            <Modal
                visible={showUploadModal}
                transparent={true}
                animationType="fade"
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}>
                    <View style={tw`bg-white rounded-xl p-6 w-80 mx-4`}>
                        <Text style={tw`text-lg font-bold text-gray-800 mb-4 text-center`}>
                            Carregando Recurso
                        </Text>

                        <View style={tw`bg-gray-200 rounded-full h-3 mb-4`}>
                            <View
                                style={[
                                    tw`bg-indigo-600 h-3 rounded-full`,
                                    { width: `${uploadProgress}%` }
                                ]}
                            />
                        </View>

                        <Text style={tw`text-center text-gray-600`}>
                            {uploadProgress}% concluído
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Error Display */}
            {error && (
                <View style={tw`absolute top-20 left-4 right-4 bg-red-500 p-3 rounded-lg`}>
                    <Text style={tw`text-white text-center font-medium`}>{error}</Text>
                </View>
            )}
        </View>
    );
}
