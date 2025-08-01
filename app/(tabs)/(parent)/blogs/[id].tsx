import { api } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { WebView } from 'react-native-webview'

// Interface cho dữ liệu thực tế từ API
interface ApiBlog {
  _id: string;
  title: string;
  description: string;
  content: string;
  categoryName: string;
  username: string;
  totalComments: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  categoryId: string;
  userId: string;
  commentIds: string[];
  banner?: string;
  image?: string;
}

interface ApiComment {
  _id: string;
  content: string;
  blogId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  __v?: number;
}

export default function BlogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [blog, setBlog] = useState<ApiBlog | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(400);

  const loadBlogDetail = async () => {
    try {
      if (!id) return;
      
      // Lấy thông tin blog
      const blogResponse = await api.getBlogById(id);
      
      if (blogResponse.success) {
        setBlog(blogResponse.data);
        
        // Nếu blog có commentIds, lấy chi tiết từng comment
        if (blogResponse.data.commentIds && blogResponse.data.commentIds.length > 0) {
          try {
            // Sử dụng commentIds để lấy từng comment
            const commentPromises = blogResponse.data.commentIds.map(commentId => 
              api.getCommentById(commentId)
            );
            
            const commentResponses = await Promise.all(commentPromises);
            const validComments = commentResponses
              .filter(response => response.success)
              .map(response => response.data);
            
            setComments(validComments);
          } catch (commentError) {
            console.error('Error loading comments:', commentError);
            setComments([]);
          }
        } else {
          setComments([]);
        }
      } else {
        Alert.alert('Lỗi', blogResponse.message || 'Không thể tải bài viết');
      }
    } catch (error) {
      console.error('Error loading blog detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBlogDetail();
  };

  const submitComment = async () => {
    if (!commentText.trim() || !id) return;
    
    setSubmittingComment(true);
    try {
      await api.createComment({
        content: commentText.trim(),
        blogId: id
      });
      
      setCommentText('');
      // Reload blog để lấy commentIds mới
      await loadBlogDetail();
      
      Alert.alert('Thành công', 'Bình luận đã được gửi');
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Lỗi', 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  useEffect(() => {
    loadBlogDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
      </View>

      {/* Blog Content */}
      <View style={styles.blogContainer}>
        {/* Banner Image */}
        {blog.banner && (
          <Image 
            source={{ uri: blog.banner }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.blogContentArea}>
          <Text style={styles.blogTitle}>{blog.title}</Text>
          
          <View style={styles.blogMeta}>
            <Text style={styles.blogAuthor}>
              Tác giả: {blog.username || 'Ẩn danh'}
            </Text>
            <Text style={styles.blogDate}>
              {formatDate(blog.createdAt)}
            </Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{blog.categoryName || 'Chưa phân loại'}</Text>
            </View>
          </View>
          
          {blog.description && (
            <Text style={styles.blogDescription}>{blog.description}</Text>
          )}
          
          {/* HTML Content with WebView */}
          <View style={styles.webViewContainer}>
            <WebView
              source={{ html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 16px;
                      }
                      img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        margin: 8px 0;
                      }
                      h1, h2, h3, h4, h5, h6 {
                        color: #1a1a1a;
                        margin-top: 24px;
                        margin-bottom: 16px;
                      }
                      p {
                        margin-bottom: 16px;
                      }
                      a {
                        color: #007AFF;
                        text-decoration: none;
                      }
                    </style>
                  </head>
                  <body>
                    ${blog.content}
                    <script>
                      function sendHeight() {
                        const height = document.body.scrollHeight;
                        window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
                      }
                      window.addEventListener('load', sendHeight);
                      setTimeout(sendHeight, 100);
                    </script>
                  </body>
                </html>
              ` }}
              style={[styles.webView, { height: webViewHeight }]}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.height) {
                    setWebViewHeight(Math.max(200, data.height + 20));
                  }
                } catch (error) {
                  console.log('Error parsing WebView message:', error);
                }
              }}
            />
          </View>
          
          {/* Additional Image */}
          {blog.image && (
            <Image 
              source={{ uri: blog.image }}
              style={styles.contentImage}
              resizeMode="cover"
            />
          )}
        </View>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>
          Bình luận ({blog.totalComments || comments.length})
        </Text>
        
        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Viết bình luận..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity 
            style={[styles.submitButton, !commentText.trim() && styles.submitButtonDisabled]}
            onPress={submitComment}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Comments List */}
        {comments.length > 0 ? (
          comments.map((comment) => (
            <View key={comment._id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>
                  {comment.username || 'Ẩn danh'}
                </Text>
                <Text style={styles.commentDate}>
                  {formatDate(comment.createdAt)}
                </Text>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  blogContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 0,
    borderRadius: 12,
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
    height: 250,
  },
  blogContentArea: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  blogMeta: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  blogAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  blogDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  blogDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  blogContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  webViewContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webView: {
    height: 400,
    backgroundColor: 'transparent',
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 16,
  },
  commentsSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});