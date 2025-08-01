import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Interface cho dữ liệu thực tế từ API
interface ApiBlog {
  _id: string;
  title: string;
  description: string;
  content: string;
  categoryName: string;
  totalComments: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  banner?: string;
  image?: string;
}

interface ApiBlogSearchResponse {
  pageData: ApiBlog[];
  pageInfo: {
    pageNum: string;
    pageSize: string;
    totalItems: number;
    totalPages: number;
  };
}

export default function BlogsScreen() {
  const [blogs, setBlogs] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadBlogs = async (page: number = 1, query: string = '') => {
    try {
      setLoading(page === 1);
      
      const response: ApiBlogSearchResponse = await api.searchBlogs({
        pageNum: page,
        pageSize: 10,
        ...(query && { query })
      });
      
      if (response.pageData) {
        if (page === 1) {
          setBlogs(response.pageData);
        } else {
          setBlogs(prev => [...prev, ...response.pageData]);
        }
        
        setCurrentPage(parseInt(response.pageInfo.pageNum));
        setTotalPages(response.pageInfo.totalPages);
        setTotalItems(response.pageInfo.totalItems);
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách blog');
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách blog');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    loadBlogs(1, searchQuery);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      loadBlogs(currentPage + 1, searchQuery);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadBlogs(1, searchQuery);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
  };

  const renderBlogItem = ({ item }: { item: ApiBlog }) => (
    <TouchableOpacity 
      style={styles.blogCard}
      onPress={() => router.push(`/(tabs)/(parent)/blogs/${item._id}`)}
    >
      {/* Banner Image */}
      {item.banner && (
        <Image 
          source={{ uri: item.banner }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.blogContentContainer}>
        <View style={styles.blogHeader}>
          <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.categoryName || 'Chưa phân loại'}</Text>
          </View>
        </View>
        
        <Text style={styles.blogDescription} numberOfLines={3}>
          {item.description || stripHtml(item.content)}
        </Text>
        
        <Text style={styles.blogContent} numberOfLines={2}>
          {stripHtml(item.content)}
        </Text>
        
        <View style={styles.blogFooter}>
        <View style={styles.authorInfo}>
          <Ionicons name="person-circle" size={16} color="#666" />
          <Text style={styles.authorName}>Tác giả</Text>
        </View>
        
        <View style={styles.blogMeta}>
          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item.totalComments}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blog Y Tế Học Đường</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm blog..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.resultCount}>
        Tìm thấy {totalItems} bài viết
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || currentPage === 1) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  if (loading && currentPage === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải blog...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={blogs}
        renderItem={renderBlogItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCount: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  listContainer: {
    padding: 16,
  },
  blogCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  blogContentContainer: {
    padding: 16,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  blogDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  blogContent: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  blogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  blogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});