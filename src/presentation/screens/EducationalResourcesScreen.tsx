import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import tw from "twrnc";
import FileThumbnail from "../components/PdfViewer";
import * as VideoThumbnails from 'expo-video-thumbnails';

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
    const [downloading, setDownloading] = useState<string | null>
        (null);
    const [unpublishedFiles, setUnpublishedFiles] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [files, setFiles] = useState<FileItem[]>(generateRandomFiles());


    // Filtered results
    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        } catch (error) {
            console.log('Download error:', error);
            Alert.alert('Download Failed', 'Unable to download the file. Please try again.');
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

            setFiles([...files, newFile]);
            setUnpublishedFiles(prev => new Set(prev).add(newFileId));
        }
    };

    // Add handlePublish function
    const handlePublish = (fileId: string) => {
        setUnpublishedFiles(prev => {
            const updated = new Set(prev);
            updated.delete(fileId);
            return updated;
        });
    };


    return (
        <View style={tw`flex-1 bg-white px-4 py-4`}>
            {/* Header */}
            <View style={tw`flex-row items-center justify-between`}>
                <Pressable>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </Pressable>
                <Text style={tw`text-lg font-bold`}>Recursos Educacionais</Text>
                <Image source={{ uri: "https://via.placeholder.com/40" }} style={tw`w-10 h-10 rounded-full`} />
            </View>

            {/* Search Bar */}
            <View style={tw`flex-row bg-gray-100 px-3 py-2 rounded-full mt-4 items-center`}>
                <Ionicons name="search" size={20} color="gray" />
                <TextInput
                    placeholder="Pesquisar materiais..."
                    style={tw`flex-1 ml-2 text-gray-700`}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={handleUpload}>
                    <Ionicons name="cloud-upload-outline" size={24} color="gray" />
                </TouchableOpacity>
            </View>

            {/* Files List */}
            <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={tw`bg-gray-100 p-4 mt-4 rounded-lg border-2 ${item.type === "pdf" ? "border-blue-400" : "border-gray-300"}`}>
                        {/* Uploader Name */}
                        <Text style={tw`text-lg font-semibold`}>{item.uploader}</Text>
                        <Text style={tw`text-blue-500`}>#Mentor</Text>

                        {/* File Content Preview */}
                        {(item.type === "pdf" || item.type === "docx") ? (
                            <View style={tw`bg-white p-2 rounded-lg mt-2 flex justify-center items-center`}>
                                <Image
                                    source={{ uri: pdfImageUrl }}
                                    style={tw`w-20 h-20 object-cover`}
                                />
                                <View style={tw`absolute top-2 right-2 bg-white p-1 rounded`}>
                                    <Ionicons
                                        name={item.type === "pdf" ? "document-text" : "document"}
                                        size={24}
                                        color={item.type === "pdf" ? "#2563eb" : "#4b5563"}
                                    />
                                </View>
                            </View>
                        ) : item.type === "video" ? (
                            <View style={tw`relative mt-2`}>
                                <Image source={{ uri: item.thumbnail }} style={tw`w-full h-32 rounded-lg`} />
                                <Ionicons name="play-circle" size={40} color="white" style={tw`absolute top-10 left-1/2 -ml-5`} />
                                <Text style={tw`text-xs text-gray-500`}>{item.duration}</Text>
                            </View>
                        ) : item.type === "image" ? (
                            <Image source={{ uri: item.thumbnail }} style={tw`w-full h-40 object-cover rounded-lg mt-2`} />
                        ) : (
                            <View style={tw`bg-white p-2 rounded-lg mt-2`}>
                                <Text style={tw`text-sm text-gray-700`}>{item.name}</Text>
                            </View>
                        )}

                        {/* File Info */}
                        <View style={tw`mt-2 flex-row justify-between`}>
                            <Text style={tw`text-xs text-gray-500`}>{item.date}</Text>
                            <Text style={tw`text-xs text-gray-500`}>{item.size}</Text>
                        </View>

                        {/* Download Button */}
                        <TouchableOpacity
                            style={tw`mt-2 ${downloading === item.id ? 'bg-gray-400' : unpublishedFiles.has(item.id) ? 'bg-green-500' : 'bg-blue-500'} p-2 rounded-lg flex-row items-center justify-center`}
                            onPress={() => unpublishedFiles.has(item.id) ? handlePublish(item.id) : handleDownload(item)}
                            disabled={downloading === item.id}
                        >
                            {downloading === item.id ? (
                                <Text style={tw`text-sm font-semibold text-white`}>Downloading...</Text>
                            ) : unpublishedFiles.has(item.id) ? (
                                <>
                                    <Ionicons name="cloud-upload-outline" size={18} color="white" />
                                    <Text style={tw`ml-2 text-sm font-semibold text-white`}>Publicar</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="download-outline" size={18} color="white" />
                                    <Text style={tw`ml-2 text-sm font-semibold text-white`}>Baixar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}
