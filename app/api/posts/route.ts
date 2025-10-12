import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/posts - Get all posts with user info, likes count, and comments count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Fetch posts with user info
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        user:users!posts_user_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Get likes count for each post
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id, user_id');

    // Get comments count for each post
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('post_id');

    // Build counts map
    const likesCounts: Record<string, number> = {};
    const commentsCounts: Record<string, number> = {};
    const userLikes: Record<string, boolean> = {};

    likesData?.forEach((like) => {
      likesCounts[like.post_id] = (likesCounts[like.post_id] || 0) + 1;
      if (userId && like.user_id === userId) {
        userLikes[like.post_id] = true;
      }
    });

    commentsData?.forEach((comment) => {
      commentsCounts[comment.post_id] = (commentsCounts[comment.post_id] || 0) + 1;
    });

    // Combine data
    const enrichedPosts = posts?.map((post) => ({
      ...post,
      likes_count: likesCounts[post.id] || 0,
      comments_count: commentsCounts[post.id] || 0,
      user_has_liked: userLikes[post.id] || false,
    }));

    return NextResponse.json(enrichedPosts);
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, content } = body;

    // Validate required fields
    if (!user_id || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id,
        title,
        content,
      })
      .select(`
        *,
        user:users!posts_user_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // Add counts to response
    const enrichedData = {
      ...data,
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
    };

    return NextResponse.json(enrichedData, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
