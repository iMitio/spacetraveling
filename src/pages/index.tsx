import { GetStaticProps } from 'next';
import Head from "next/head"
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import { FiUser } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi'

import { format } from 'date-fns';
import {ptBR} from "date-fns/locale"

import styles from './home.module.scss';
import commonStyles from "../styles/common.module.scss"

import Link from 'next/link';
import { RichText } from 'prismic-dom';
import Header from '../components/Header';


interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}


export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy', {
          locale: ptBR
        }
      )
    }
  })

  const [ posts, setPosts ] = useState<Post[]>(formattedPost)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState(1);


 async function handleNextPage(): Promise<void> {
  if(currentPage !== 1 && nextPage === null){
    return
  }


  const postsResult = await  fetch(`${nextPage}`)
  .then(response =>
    response.json()
  )
  setNextPage(postsResult.next_page)
  setCurrentPage(postsResult.page)

  const newPost = postsResult.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date:  format(
        new Date(post.first_publication_date),
        'dd MMM yyyy', {
          locale: ptBR
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })
  setPosts([...posts, ...newPost])
 }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <Header/>
        <div className={styles.posts}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <strong>{post.data.title}</strong>
              {<p>{post.data.subtitle}</p>}
              <ul>
                <li>
                  <FiCalendar/>
                  {post.first_publication_date}</li>
                <li>
                  <FiUser/>
                  { post.data.author }
                </li>
              </ul>
            </a>
          </Link>
        ))}

        {nextPage && (
           <button onClick={handleNextPage}>
             Carregar mais posts
          </button>
        )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});

  const postsResponse = await prismic.getByType('posts', {
    lang: 'pt-BR',
    pageSize: 1
  });


  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  })

  console.log(posts)

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }

  return {
    props: {
      postsPagination
    }
  }
};
