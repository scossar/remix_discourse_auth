import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

import Header from "~/components/Header";

export interface TopicListTopic {
  id: number;
  title: string;
  slug: string;
  posts_count: number;
  created_at: Date;
  excerpt?: string;
}

export interface TopicList {
  more_topics_url?: string | null;
  topics?: Array<TopicListTopic>;
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
  const apiKey = process.env.DISCOURSE_API_KEY;

  const response = await fetch("http://localhost:4200/latest.json");
  const latestTopics = await response.json();
  const list = latestTopics.topic_list;
  const moreTopicsUrl = list?.more_topics_url;
  const topicListTopics = list?.topics;

  return json({ topic_list: { topics: topicListTopics } });
};

export default function Index() {
  const { topic_list } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="p-3  max-w-screen-md mx-auto">
        <h1 className="text-3xl">Latest Topics</h1>
        <ul>
          {topic_list?.topics?.map((topic: TopicListTopic) => (
            <li key={topic.id}>
              <Link to={`/t/${topic.slug}/${topic.id}`}>{topic.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
