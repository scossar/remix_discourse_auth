import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, redirect, useLoaderData } from "@remix-run/react";
import { sessionStorage } from "~/services/session.server";

interface Post {
  id: number;
  username: string;
  post_number: number;
  cooked: string;
}

interface PostStream {
  posts: Array<Post>;
}

interface Topic {
  id: number;
  title: string;
  posts_count: number;
  post_stream: PostStream;
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!params.slug || !params.topicId) {
    return redirect("/");
  }

  const userSession = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const currentUsername = userSession.get("username");
  const apiUsername = currentUsername || "system";
  const apiKey = process.env.DISCOURSE_API_KEY;
  if (!apiKey) {
    return redirect("/");
  }
  const slug = params.slug;
  const topicId = params.topicId;
  const headers = new Headers();
  headers.append("Api-Key", apiKey);
  headers.append("Api-Username", apiUsername);

  const response = await fetch(
    `http://localhost:4200/t/${slug}/${topicId}.json`,
    {
      headers: headers,
    }
  );
  const topic: Topic = await response.json();
  const title = topic.title;
  const postStream = topic.post_stream;
  const posts = postStream.posts;

  return json({ title: title, posts: posts, topicId: topicId });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const reply = String(formData.get("reply"));
  const topicId = Number(formData.get("topicId"));
  const apiKey = process.env.DISCOURSE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const data = {
    raw: reply,
    topic_id: topicId,
  };
  const headers = new Headers();
  headers.append("Api-Key", apiKey);
  headers.append("Api-Username", "system");
  headers.append("Content-Type", "application/json");
  const response = await fetch(`http://localhost:4200/posts.json`, {
    method: "Post",
    headers: headers,
    body: JSON.stringify(data),
  });

  const updatedTopic = await response.json();
  console.log(`Updated Topic: ${JSON.stringify(updatedTopic, null, 2)}`);

  return null;
};

export default function Topic() {
  const { title, posts, topicId } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-screen-md mx-auto pt-10">
      <h1 className="text-slate-50 text-3xl">{title}</h1>
      <div>
        {posts.map((post) => (
          <div
            key={post.id}
            className="my-3 border-2 border-slate-50 rounded-sm p-3 mx-3"
          >
            <div
              className="discourse-post"
              dangerouslySetInnerHTML={{ __html: post.cooked }}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 pb-4">
        <Form
          method="post"
          action="?"
          className="text-slate-900 flex flex-col mx-3 mb-4"
        >
          <textarea
            className="p-3"
            name="reply"
            id=""
            cols={12}
            rows={8}
          ></textarea>
          <input type="hidden" name="topicId" value={topicId} />
          <button
            className="bg-slate-50 text-slate-900 mt-3 inline-block px-3 py-2 w-fit"
            type="submit"
          >
            Reply
          </button>
        </Form>
      </div>
    </div>
  );
}
